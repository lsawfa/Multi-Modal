# Multi-Modal Biometrics

Laporan ini menjelaskan struktur direktori, data yang digunakan, tahapan pelatihan model, serta bagaimana keseluruhan arsitektur 6 modul biometrik terintegrasi di dalam proyek ini untuk mendeteksi anomali (Authentic vs Suspicious).

## 1. Struktur Direktori dan Data

Proyek ini telah direstrukturisasi agar lebih rapi dengan memisahkan kumpulan *dataset* mentah, skrip *utility*, serta file eksekusi utama.

- **`datasets/public_datasets/`**
  - Menyimpan dataset publik (seperti **HMOG Dataset**, **CMU Keystroke**, **DSL-StrongPasswordData**, dan **Aalto Keystroke**) yang digunakan pada tahap **Base Training**.
- **`datasets/raw_backups/`**
  - Menyimpan data mentah atau log keluaran sementara (seperti `output.csv` yang berukuran sangat besar, hasil dari Aalto Dataset) agar tidak mengotori *root folder*.
- **`real-data/`**
  - Berisi file `synthetic-sessions.csv` yang merupakan data interaksi aplikasi secara *real-time*. Data inilah yang diekstrak untuk proses *Fine-Tuning*.
- **`utils/`**
  - Berisi berbagai *script* untuk mempersiapkan dan mengonversi data, seperti `convert_cmu.py`, `convert_ky.py`, dan `generate_synthetic_data.py`.
- **`models/`**
  - Folder tempat penyimpanan seluruh bobot model `.pkl` dan `.h5`. Di sini juga terdapat file konfigurasi interkoneksi, yakni `fusion_model_ft.json`.
- **Skrip Utama di *Root Folder***
  - `train_multimodal.py`: Skrip utama untuk melakukan *Base Training*.
  - `finetune_multimodal.py`: Skrip untuk melakukan *Fine-Tuning* pada 6 modul.
  - `predict.py`: Skrip prediksi *standalone*.
  - `create_eval_notebook.py`: Skrip generator visualisasi Jupyter Notebook.

## 2. Fase Pelatihan Model

Proses pelatihan model di sistem ini dibagi ke dalam dua fase utama, yaitu Fase 1 (Base Training) dan Fase 2 (Fine-Tuning).

### Fase 1: Base Training (Pre-training)
Pada fase awal ini, sistem dilatih (menggunakan `train_multimodal.py`) agar dapat mengenali konsep dasar dari pola *behavioral biometrics* manusia sebelum diterapkan ke kasus sistem yang lebih spesifik. Fase ini mencakup pelatihan awal untuk **keenam sub-model**. Beberapa model dilatih memanfaatkan dataset publik berskala besar, sementara yang lain diinisialisasi menggunakan data dasar tersimulasi:
- **Scroll & Touch**: Dilatih menggunakan **HMOG Dataset** untuk mengenali pola geseran wajar vs anomali.
- **Keystroke Dynamics**: Dilatih menggunakan **CMU Keystroke Dataset**, **DSL-StrongPasswordData**, dan **Aalto Keystroke Dataset** untuk mempelajari pola latensi ketikan secara universal.
- **Cognitive Load, Image Interaction, & Copy-Paste**: Diinisialisasi di fase ini dengan aturan heuristik dan data dasar bersiap untuk tahap transfer data riil.

*Output dari Fase 1 ini adalah 6 model-model *base* awal (misalnya `scroll_model.pkl`, `signature_model.h5`, `cognitive_model.pkl`, dll).*

### Fase 2: Fine-Tuning (Transfer Learning)
Karena model dari Fase 1 masih bersifat "universal", sistem kemudian melakukan *Fine-Tuning* (melalui `finetune_multimodal.py`) menggunakan data **riil dan spesifik** dari aplikasi (*domain-specific data*) yang terekam pada `real-data/synthetic-sessions.csv`.

Fase inilah yang melatih dan merangkum keseluruhan sistem menjadi **6 sub-model** yang siap memilah anomali:
1. **Keystroke Dynamics**: Menganalisa latensi *keyup* dengan model LSTM.
2. **Copy-Paste & Input Manipulation**: *Rule-based heuristic* untuk mendeteksi *paste* cepat/tidak wajar.
3. **Cognitive Load / Search**: *Random Forest* penganalisa jumlah koreksi (*Backspace*), durasi pencarian, dan latensi *hesitation*.
4. **Scroll / Reading Behavior**: *Random Forest* dari perhitungan *velocity* dan jangkauan Y-axis.
5. **Signature / Touch Pad**: Analisis tekanan dan koordinat X/Y tanda tangan dengan arsitektur CNN-LSTM.
6. **Image Interaction / Gesture**: *Random Forest* yang menganalisa frekuensi `zoom` aset grafis.

Seluruh *sub-model* tersebut akan dimutakhirkan ke model akhir dengan nama berakhiran `_ft` (misal: `scroll_model_ft.pkl`).

## 3. Fusion Layer & Hasil Evaluasi

- Pada akhir Fase 2, *pipeline* mengalokasikan nilai *Weights* (bobot kepercayaan) kepada ke-6 modul tersebut secara matematis berdasarkan besaran akurasinya. Bobot ini disimpan ke dalam *Fusion Layer* (`fusion_model_ft.json`).
- Pada saat proses verifikasi identitas di aplikasi, ke-6 model ini bekerja paralel lalu mengirimkan *score* masing-masing ke *Fusion Layer*. *Fusion Layer* mengkalikan *score* tiap modul dengan bobotnya untuk mendapatkan skor agregat (0.0 - 1.0). Jika di atas 0.5 maka dinyatakan **AUTHENTIC**.
- Semua komparasi peningkatan akurasi dari Fase 1 ke Fase 2 dirender menggunakan skrip `create_eval_notebook.py` yang dapat dilihat divisualisasikan dalam `eval_multimodal.ipynb`.
