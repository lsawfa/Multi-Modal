"""
convert_keystrokes.py
---------------------
Batch convert semua *_keystrokes.txt (136M Aalto format) ke 1 CSV
dengan schema persis seperti behavior-sessions pharmacy app.

CARA PAKAI:
  1. Taruh script ini di folder yang sama dengan file-file *_keystrokes.txt
  2. Jalankan: python convert_keystrokes.py
  3. Output: aalto_keystrokes_converted.csv

ATAU kalau file txt-nya di folder lain:
  python convert_keystrokes.py --input_dir "G:/Kegiatan/Project/.../files" --output "hasil.csv"
"""

import os
import glob
import json
import csv
import argparse
from pathlib import Path


def convert_files(input_dir: str, output_path: str):
    # Cari semua file txt di folder
    pattern = os.path.join(input_dir, "*_keystrokes.txt")
    files = sorted(glob.glob(pattern))

    if not files:
        print(f"[ERROR] Tidak ada file *_keystrokes.txt di: {input_dir}")
        return

    print(f"[INFO] Ditemukan {len(files)} file. Mulai konversi...")

    schema_columns = [
        "session_id", "user_id", "started_at_epoch", "ended_at_epoch",
        "session_duration_ms", "scenario_type", "interaction_timestamp_epoch",
        "event_index", "event_type", "event_timestamp", "event_timestamp_epoch",
        "target_id", "key_code", "x", "y", "scroll_y", "pressure", "raw_json"
    ]

    total_rows = 0

    with open(output_path, "w", newline="", encoding="utf-8") as out_f:
        writer = csv.DictWriter(out_f, fieldnames=schema_columns)
        writer.writeheader()

        for filepath in files:
            filename = Path(filepath).name
            print(f"  → Processing: {filename}")

            # Baca semua row dari file ini
            rows_by_session = {}  # key: TEST_SECTION_ID, val: list of row dicts

            try:
                with open(filepath, "r", encoding="utf-8", errors="replace") as f:
                    header = None
                    for line in f:
                        line = line.rstrip("\n")
                        if not line:
                            continue
                        parts = line.split("\t")
                        if header is None:
                            header = parts
                            continue
                        if len(parts) != len(header):
                            continue  # skip malformed rows

                        row = dict(zip(header, parts))
                        sid = row["TEST_SECTION_ID"]
                        if sid not in rows_by_session:
                            rows_by_session[sid] = []
                        rows_by_session[sid].append(row)

            except Exception as e:
                print(f"    [WARN] Gagal baca {filename}: {e}")
                continue

            # Konversi per session
            for section_id, events in rows_by_session.items():
                participant_id = events[0]["PARTICIPANT_ID"]

                # Hitung start & end epoch dari PRESS_TIME & RELEASE_TIME
                press_times  = [int(float(e["PRESS_TIME"]))   for e in events]
                release_times = [int(float(e["RELEASE_TIME"])) for e in events]

                started_at   = min(press_times)
                ended_at     = max(release_times)
                duration_ms  = ended_at - started_at

                session_id = f"{participant_id}-{section_id}"

                for idx, event in enumerate(events):
                    press_time   = int(float(event["PRESS_TIME"]))
                    release_time = int(float(event["RELEASE_TIME"]))
                    hold_time_ms = release_time - press_time

                    # event_timestamp = relatif dari start session (ms)
                    event_timestamp = release_time - started_at

                    raw_json_obj = {
                        "type": "keyup",
                        "key_code": event["LETTER"],
                        "hold_time_ms": hold_time_ms,
                        "keycode": int(event["KEYCODE"]) if event["KEYCODE"].isdigit() else event["KEYCODE"]
                    }

                    out_row = {
                        "session_id":                   session_id,
                        "user_id":                      participant_id,
                        "started_at_epoch":             started_at,
                        "ended_at_epoch":               ended_at,
                        "session_duration_ms":          duration_ms,
                        "scenario_type":                "search",
                        "interaction_timestamp_epoch":  press_time,
                        "event_index":                  idx,
                        "event_type":                   "keyup",
                        "event_timestamp":              event_timestamp,
                        "event_timestamp_epoch":        release_time,
                        "target_id":                    "",
                        "key_code":                     event["LETTER"],
                        "x":                            "",
                        "y":                            "",
                        "scroll_y":                     "",
                        "pressure":                     "",
                        "raw_json":                     json.dumps(raw_json_obj, ensure_ascii=False)
                    }

                    writer.writerow(out_row)
                    total_rows += 1

    print(f"\n[DONE] Total {total_rows:,} rows ditulis ke: {output_path}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Convert Aalto keystroke TXT files ke pharmacy CSV schema")
    parser.add_argument(
        "--input_dir",
        default=".",
        help="Folder yang berisi *_keystrokes.txt (default: folder script ini)"
    )
    parser.add_argument(
        "--output",
        default="aalto_keystrokes_converted.csv",
        help="Nama file output CSV (default: aalto_keystrokes_converted.csv)"
    )
    args = parser.parse_args()

    convert_files(
        input_dir=os.path.abspath(args.input_dir),
        output_path=os.path.abspath(args.output)
    )