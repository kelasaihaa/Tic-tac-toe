# Tic Tac Toe

Permainan Tic Tac Toe dalam pelayar. Tiada dependency, tiada langkah build — buka `index.html` dan terus main.

## Ciri-ciri

- **Dua mod** — lawan komputer, atau 2 pemain pada peranti yang sama
- **Tiga tahap kesukaran** — Mudah, Sederhana, dan Mustahil
- **AI Mustahil tidak boleh dikalahkan** — guna algoritma minimax dengan pemangkasan alpha-beta. Anda hanya mampu seri
- **Pilih simbol anda** — main sebagai X (mula dahulu) atau O
- **Papan skor kekal** — skor disimpan dalam `localStorage`, tak hilang bila tutup pelayar
- **Kawalan papan kekunci** — kekunci `1`–`9` untuk letak simbol, `R` untuk main semula
- **Responsif** — sesuai untuk telefon dan desktop
- **Boleh diakses** — label ARIA, penunjuk fokus, dan menghormati `prefers-reduced-motion`

## Cara main

Buka fail `index.html` terus dalam pelayar.

Atau hidangkan melalui server tempatan:

```bash
python3 -m http.server 8000
# kemudian buka http://localhost:8000
```

Susun atur kekunci mengikut kedudukan petak:

```
1 | 2 | 3
--+---+--
4 | 5 | 6
--+---+--
7 | 8 | 9
```

## Struktur projek

```
tic-tac-toe/
├── index.html   # struktur halaman
├── style.css    # tema gelap, susun atur responsif, animasi
├── script.js    # logik permainan + AI (dua bahagian: logik tulen & UI)
├── test.js      # ujian untuk logik permainan
└── README.md
```

## Ujian

`script.js` dibahagi kepada dua bahagian. Bahagian pertama ialah logik tulen tanpa
sentuhan DOM, dan didedahkan melalui `module.exports`. Ini bermakna ujian
menjalankan **kod yang sama** seperti yang digunakan dalam pelayar, bukan salinan.

```bash
node test.js
```

Ujian merangkumi pengesanan kemenangan bagi kesemua 8 barisan, pengendalian seri,
dan yang paling penting: **AI Mustahil dimainkan menentang setiap kombinasi
langkah yang mungkin untuk memastikan ia tidak pernah kalah.**

## Bagaimana AI berfungsi

AI menilai setiap langkah dengan mensimulasikan permainan sehingga tamat
(`minimax`). Ia menganggap pihak lawan juga bermain sebaik mungkin.

- Kemenangan bernilai `10 - depth` — semakin cepat menang, semakin tinggi skornya
- Kekalahan bernilai `depth - 10` — kalau kalah tak dapat dielak, lengahkan selama mungkin
- Seri bernilai `0`

Pemangkasan alpha-beta membuang cabang yang sudah pasti lebih buruk, jadi carian
selesai serta-merta walaupun dari papan yang kosong.

Tahap kesukaran mengubah **kekerapan** AI memilih langkah optimum:

| Tahap | Peluang langkah optimum |
|---|---|
| Mudah | 15% |
| Sederhana | 70% |
| Mustahil | 100% |

Pada tahap Mudah dan Sederhana, langkah selebihnya dipilih secara rawak — itu
yang memberi anda peluang menang.

## Lisensi

MIT
