import os
import sys
import json
import numpy as np
import pandas as pd
import joblib
import warnings
warnings.filterwarnings('ignore')
import tensorflow as tf
from tensorflow.keras.models import load_model

def load_models(model_dir):
    print(f"Loading models from {model_dir}...")
    models = {}
    # Keystroke
    try:
        models['keystroke'] = load_model(os.path.join(model_dir, 'keystroke_model.h5'))
        models['ks_label_map'] = joblib.load(os.path.join(model_dir, 'keystroke_label_map.pkl'))
    except: pass
    
    # Scroll
    try:
        models['scroll'] = joblib.load(os.path.join(model_dir, 'scroll_model.pkl'))
        models['scroll_scaler'] = joblib.load(os.path.join(model_dir, 'scroll_scaler.pkl'))
    except: pass

    # Signature
    try:
        models['signature'] = load_model(os.path.join(model_dir, 'signature_model.h5'))
    except: pass

    # Fusion
    with open(os.path.join(model_dir, 'fusion_model.json'), 'r') as f:
        models['fusion'] = json.load(f)
        
    return models

def extract_scroll_features(session_data):
    v = np.array(session_data['velocity'])
    p = np.array(session_data['position'])
    t = np.array(session_data['time'])
    
    scroll_diffs = np.diff(p)
    dir_changes = np.sum(np.abs(np.diff(np.sign(scroll_diffs))) > 0) if len(scroll_diffs) > 1 else 0
    time_diffs = np.diff(t)
    
    return {
        'avg_velocity': np.mean(np.abs(v)),
        'max_velocity': np.max(np.abs(v)),
        'min_velocity': np.min(np.abs(v)),
        'std_velocity': np.std(v),
        'total_scroll_distance': np.sum(np.abs(np.diff(p))),
        'n_scroll_events': len(v),
        'n_direction_changes': dir_changes,
        'avg_time_between_scrolls': np.mean(time_diffs) if len(time_diffs) > 0 else 0,
        'viewport_progress_max': 1.0,
        'scroll_range': np.max(p) - np.min(p),
    }

def run_inference(csv_path, model_dir):
    models = load_models(model_dir)
    df = pd.read_csv(csv_path, dtype=str)
    
    print("\n" + "="*50)
    print("REAL-TIME INFERENCE SIMULATION")
    print("="*50)
    
    for session_id in df['session_id'].unique():
        session = df[df['session_id'] == session_id]
        user_id = session['user_id'].iloc[0]
        events = session['event_type'].value_counts().to_dict()
        
        scores = {}
        
        # 1. Scroll Analysis
        if 'scroll' in events and 'scroll' in models:
            vels, pos, times = [], [], []
            scroll_df = session[session['event_type'] == 'scroll']
            for _, row in scroll_df.iterrows():
                try:
                    rj = json.loads(str(row['raw_json']).replace('""', '"'))
                    vels.append(float(rj.get('velocity', 0)))
                    pos.append(float(rj.get('scroll_y', 0)))
                    times.append(float(row['event_timestamp']))
                except: pass
                
            if len(vels) > 1:
                feats = extract_scroll_features({'velocity': vels, 'position': pos, 'time': times})
                X = np.array(list(feats.values())).reshape(1, -1).astype(np.float32)
                X_scaled = models['scroll_scaler'].transform(X)
                proba = models['scroll'].predict_proba(X_scaled)[0]
                scores['scroll'] = max(proba)

        # 2. Signature Analysis
        if 'signature_stroke' in events and 'signature' in models:
            sig_df = session[session['event_type'] == 'signature_stroke']
            all_pts = []
            for _, row in sig_df.iterrows():
                try:
                    rj = json.loads(str(row['raw_json']).replace('""', '"'))
                    points = rj.get('points', [])
                    for p in points:
                        all_pts.append({
                            'x': float(p['x']), 'y': float(p['y']),
                            'pressure': float(p.get('pressure', 0.5)),
                            'timestamp': float(p['timestamp']),
                            'is_stroke_start': p.get('is_stroke_start', False)
                        })
                except: pass
                
            if len(all_pts) >= 5:
                xs = np.array([p['x'] for p in all_pts])
                ys = np.array([p['y'] for p in all_pts])
                pr = np.array([p['pressure'] for p in all_pts])
                ts = np.array([p['timestamp'] for p in all_pts])
                ss = np.array([1.0 if p['is_stroke_start'] else 0.0 for p in all_pts])
                
                xr = (xs.max() - xs.min()) or 1
                yr = (ys.max() - ys.min()) or 1
                xn = (xs - xs.min()) / xr
                yn = (ys - ys.min()) / yr
                dt = np.diff(ts); dt[dt==0] = 1e-3
                dx = np.concatenate([[0], np.diff(xs)/dt])
                dy = np.concatenate([[0], np.diff(ys)/dt])
                vel = np.sqrt(dx**2 + dy**2)
                
                feat = np.column_stack([xn, yn, pr, dx, dy, vel, ss]).astype(np.float32)
                if len(feat) < 80:
                    feat = np.vstack([feat, np.zeros((80-len(feat), 7))])
                feat = feat[:80]
                
                for i in range(7):
                    m, s = feat[:,i].mean(), feat[:,i].std() + 1e-8
                    feat[:,i] = (feat[:,i] - m) / s
                
                pred = models['signature'].predict(feat.reshape(1,80,7), verbose=0)
                scores['signature'] = float(max(pred[0]))

        # 3. Keystroke Analysis (Placeholder if not enough data)
        # Assuming we might have keystrokes, though not standard in pharmacy app
        # For this demo, we'll rely on scroll and signature if they exist
        
        # Fusion Layer
        weights = models['fusion']['weights']
        threshold = models['fusion']['threshold']
        
        if scores:
            total_w = sum(weights.get(k, 0.33) for k in scores)
            if total_w > 0:
                risk = sum(s * weights.get(k, 0.33) for k, s in scores.items()) / total_w
            else:
                risk = 0.5
        else:
            risk = 0.5
            
        verdict = 'AUTHENTIC' if risk > threshold else 'SUSPICIOUS'
        
        print(f"\n[SESSION] {session_id}")
        print(f"User ID       : {user_id}")
        print(f"Events Found  : {events}")
        print(f"Model Scores  : {scores}")
        print(f"Fusion Score  : {risk:.4f} (Threshold: {threshold})")
        print(f"Verdict       : >>> {verdict} <<<")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python predict.py <path_to_csv>")
        sys.exit(1)
        
    csv_file = sys.argv[1]
    model_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'models')
    
    if not os.path.exists(csv_file):
        print(f"Error: File not found - {csv_file}")
        sys.exit(1)
        
    run_inference(csv_file, model_dir)
