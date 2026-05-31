import os
import json
import uuid
import numpy as np
import pandas as pd

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
REAL_DATA_PATH = os.path.join(BASE_DIR, 'real-data', 'behavior-sessions-1780141120569.csv')
OUTPUT_PATH = os.path.join(BASE_DIR, 'real-data', 'synthetic-sessions.csv')

NUM_SYNTHETIC_SESSIONS_PER_REAL = 50

def add_noise_to_json(json_str, event_type):
    try:
        data = json.loads(json_str.replace('""', '"'))
        
        if event_type == 'scroll':
            # Add noise to velocity and scroll_y
            if 'velocity' in data:
                noise_vel = np.random.normal(0, 0.05)
                data['velocity'] = float(data['velocity']) + noise_vel
            if 'scroll_y' in data:
                noise_y = np.random.normal(0, 10)
                data['scroll_y'] = max(0, float(data['scroll_y']) + noise_y)
            if 'timestamp' in data:
                data['timestamp'] += np.random.normal(0, 5)
                
        elif event_type == 'signature_stroke':
            # Add noise to points
            if 'points' in data:
                for pt in data['points']:
                    pt['x'] += np.random.normal(0, 2.0)
                    pt['y'] += np.random.normal(0, 2.0)
                    pt['pressure'] = np.clip(pt.get('pressure', 0.5) + np.random.normal(0, 0.05), 0.1, 1.0)
                    pt['timestamp'] += np.random.normal(0, 2.0)
                    
        # Re-stringify exactly as CSV needs it (pandas handles double quotes automatically if dict passed)
        # But we will return a string to keep the dataframe structure identical
        return json.dumps(data)
    except:
        return json_str

def main():
    print(f"Loading original data from {REAL_DATA_PATH}...")
    df_original = pd.read_csv(REAL_DATA_PATH, dtype=str)
    
    sessions = df_original['session_id'].unique()
    print(f"Found {len(sessions)} original sessions.")
    
    all_new_rows = []
    
    # 1. Keep original data
    for _, row in df_original.iterrows():
        all_new_rows.append(row.to_dict())
        
    # 2. Generate synthetic data
    print(f"Generating {NUM_SYNTHETIC_SESSIONS_PER_REAL} synthetic sessions per original session...")
    for session_id in sessions:
        session_df = df_original[df_original['session_id'] == session_id]
        
        for i in range(NUM_SYNTHETIC_SESSIONS_PER_REAL):
            new_session_id = f"{session_id}-synth-{i}"
            
            for _, row in session_df.iterrows():
                new_row = row.copy()
                new_row['session_id'] = new_session_id
                
                # Add noise to event timestamp
                try:
                    new_ts = float(new_row['event_timestamp']) + np.random.normal(0, 5)
                    new_row['event_timestamp'] = str(new_ts)
                except: pass
                
                # Add noise to JSON
                new_row['raw_json'] = add_noise_to_json(str(new_row['raw_json']), str(new_row['event_type']))
                
                all_new_rows.append(new_row.to_dict())
                
    df_synthetic = pd.DataFrame(all_new_rows)
    print(f"Generated a total of {len(df_synthetic)} events.")
    print(f"Total sessions now: {df_synthetic['session_id'].nunique()}")
    
    df_synthetic.to_csv(OUTPUT_PATH, index=False)
    print(f"Synthetic data saved to {OUTPUT_PATH}")

if __name__ == '__main__':
    main()
