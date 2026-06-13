# Tu truyen cua Anh Thu

Website doc truyen tranh ngan cho be, toi uu cho iPad va GitHub Pages.

## Chay thu

Mo truc tiep `index.html`, hoac chay mot static server:

```powershell
python -m http.server 4173
```

Sau do mo `http://localhost:4173`.

## Them truyen moi

Them mot object moi vao `stories.js`. Moi truyen co:

- `id`: ma truyen khong dau
- `displayTitle`: ten hien thi
- `topic`: chu de
- `cover`: anh bia
- `pages`: danh sach trang truyen

Moi trang chi can `text`; co the them `title`, `image`, `scene`, hoac `kind`.
