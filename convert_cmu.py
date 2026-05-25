import csv
import json
import os

input_file = r"g:\Kegiatan\Project\Digital Forensic\BIMA\Multi Modal\1. DSL-StrongPasswordData.csv"
output_file = r"g:\Kegiatan\Project\Digital Forensic\BIMA\Multi Modal\converted_CMU_Keystroke.csv"

schema = [
    "session_id", "user_id", "started_at_epoch", "ended_at_epoch", "session_duration_ms", 
    "scenario_type", "interaction_timestamp_epoch", "event_index", "event_type", 
    "event_timestamp", "event_timestamp_epoch", "target_id", "key_code", "x", "y", 
    "scroll_y", "pressure", "raw_json"
]

keys = ["period", "t", "i", "e", "five", "Shift.r", "o", "a", "n", "l", "Return"]
h_cols = [f"H.{k}" for k in keys]
dd_cols = [f"DD.{keys[i]}.{keys[i+1]}" for i in range(len(keys)-1)]

base_epoch = 1778000000000

with open(input_file, 'r', encoding='utf-8') as f_in, open(output_file, 'w', encoding='utf-8', newline='') as f_out:
    reader = csv.DictReader(f_in)
    writer = csv.writer(f_out, quoting=csv.QUOTE_MINIMAL)
    writer.writerow(schema)
    
    for row_idx, row in enumerate(reader):
        subject = row["subject"]
        session_index = row["sessionIndex"]
        rep = row["rep"]
        
        session_id = f"{subject}-{session_index}-{rep}"
        user_id = subject
        
        started_at_epoch = base_epoch + (row_idx * 10000)
        
        # Calculate timestamps for all keys first to get ended_at_epoch
        t_downs = []
        t_ups = []
        current_t_down = 0.0
        
        for i, k in enumerate(keys):
            if i == 0:
                current_t_down = 0.0
            else:
                current_t_down += float(row[dd_cols[i-1]])
            
            t_downs.append(current_t_down)
            t_up = current_t_down + float(row[h_cols[i]])
            t_ups.append(t_up)
            
        session_duration_ms = int(t_ups[-1] * 1000)
        ended_at_epoch = started_at_epoch + session_duration_ms
        
        # Write rows for each keyup event
        for i, k in enumerate(keys):
            t_up_ms = t_ups[i] * 1000
            t_down_ms = t_downs[i] * 1000
            
            event_timestamp = t_up_ms
            event_timestamp_epoch = started_at_epoch + int(t_up_ms)
            interaction_timestamp_epoch = started_at_epoch + int(t_down_ms)
            
            inter_key_interval_ms = 0
            if i > 0:
                inter_key_interval_ms = float(row[dd_cols[i-1]]) * 1000
                
            raw_json = {
                "type": "keyup",
                "key_code": k,
                "inter_key_interval_ms": inter_key_interval_ms
            }
            
            out_row = {
                "session_id": session_id,
                "user_id": user_id,
                "started_at_epoch": started_at_epoch,
                "ended_at_epoch": ended_at_epoch,
                "session_duration_ms": session_duration_ms,
                "scenario_type": "search",
                "interaction_timestamp_epoch": interaction_timestamp_epoch,
                "event_index": i,
                "event_type": "keyup",
                "event_timestamp": event_timestamp,
                "event_timestamp_epoch": event_timestamp_epoch,
                "target_id": "",
                "key_code": k,
                "x": "",
                "y": "",
                "scroll_y": "",
                "pressure": "",
                "raw_json": json.dumps(raw_json, separators=(',', ':'))
            }
            
            writer.writerow([out_row[col] for col in schema])

print(f"Successfully converted data to {output_file}")
