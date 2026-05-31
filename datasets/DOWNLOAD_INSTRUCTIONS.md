# Public Datasets Download Instructions

Karena kebijakan batas ukuran file GitHub (maksimal 100MB per file), dataset mentah publik yang berukuran ratusan Megabyte hingga Gigabyte **tidak diikutsertakan** dalam repositori ini.

Jika Anda ingin mereplikasi tahap **Base Training**, silakan unduh dataset publik dari tautan resmi berikut dan letakkan di struktur folder yang sesuai:

## 1. HMOG Dataset (Touch & Gesture)
- **Sumber**: [HMOG Dataset Website](http://www.cs.wm.edu/~hmog/)
- **Ukuran**: ~ 1 GB (Zip files)
- **Lokasi Penempatan**: Ekstrak ke `datasets/public_datasets/hmog_dataset/public_dataset/`

## 2. Aalto Keystroke Dataset
- **Sumber**: [Aalto University Keystroke Database](https://userinterfaces.aalto.fi/136Mkeystrokes/)
- **Ukuran**: ~ 4.8 GB (CSV)
- **Lokasi Penempatan**: Ekstrak `output.csv` ke `datasets/raw_backups/output.csv`

## 3. CMU Keystroke Dynamics
- **Sumber**: [CMU Keystroke Dynamics Benchmark](https://www.cs.cmu.edu/~keystroke/)
- **Lokasi Penempatan**: `datasets/public_datasets/` (lalu jalankan skrip preprocessing)

## 4. DSL-StrongPasswordData
- **Sumber**: [Data Science Lab](https://www.cs.cmu.edu/~keystroke/)
- **Lokasi Penempatan**: `datasets/public_datasets/`

---
> **Catatan**: 
> Untuk proses **Fine-Tuning**, dataset sintetis yang mensimulasikan lingkungan *real-world application* sudah otomatis ter-track di repositori ini (`real-data/synthetic-sessions.csv`) karena ukurannya yang ringan.
