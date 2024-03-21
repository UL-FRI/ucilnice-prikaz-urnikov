# ucilnice_vue

## Priprava okolja

```sh
npm install
```

### Zaženi za razvoj (Hot-Reload) 

```sh
npm run dev
```

### Pripravi za produkcijo

```sh
npm run build
```

ali 

```sh
docker compose up
```

### Ogled aplikacije

Aplikacija je dostopna na naslovu [http://localhost:8080](http://localhost:8080).

Da bi nastavili predavalnico brez ročnega izbora, je potrebno v URL dodati parameter `room`. Primer: [http://localhost:8080?room=P01](http://localhost:8080?room=R01).

Za lažji ogled delovanja aplikacije skozi čas, je na voljo tudi parameter `simulate`, ki pospeši časovni potek. Primer: [http://localhost:8080?room=P01&simulate=true](http://localhost:8080?room=P01&simulate=true).