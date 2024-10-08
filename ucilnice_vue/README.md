# ucilnice_vue

Aplikacija je narejena z ogrodjem `Vue.js`. Trenutno je prilagojena za zaslone Full HD ločljivosti (1920x1080).

## Priprava okolja

```sh
npm install
```

### Zaženi za razvoj (Hot-Reload) 

```sh
npm run dev
```

Aplikacija je dostopna na naslovu [http://localhost:8080](http://localhost:8080).

### Pripravi za produkcijo

```sh
npm run build
```

Aplikacija bo pripravljena v mapi `dist`. Slednjo je potrebno le skopirati na spletni strežnik.

Zaradi samodejne prepoznave predavalnice glede na IP naslov odjemalca, je potrebno aplikacijo ali pa vsaj datoteko `ip.php` postaviti na strežnik, ki podpira PHP. Če se uporablja drug strežnik, oziroma če datoteka ne bo dostopna v istem imeniku kot aplikacija, je potrebno spremeniti vrednost `ipUrl` v datoteki `configuration.json` na ustrezen naslov, ki bo dostopen odjemalcem. Več o konfiguraciji je opisano v nadaljevanju.

ali 

```sh
docker compose up
```

Aplikacija je dostopna na naslovu [http://localhost:8080](http://localhost:8080).

### Dodatne nastavitve

#### Izbor predavalnice

Da bi nastavili predavalnico brez ročnega izbora, je potrebno v URL dodati parameter `room`. To se uporablja le za testiranje, saj se predavalnica samodejno izbere glede na IP naslov odjemalca (več o tem v razdelku "Konfiguracija").

Primer: [http://localhost:8080?room=P01](http://localhost:8080?room=R01).

#### Simulacija

Za lažji ogled delovanja aplikacije skozi čas, je na voljo tudi parameter `simulate`, ki pospeši časovni potek.

Primer: [http://localhost:8080?room=P01&simulate=true](http://localhost:8080?room=P01&simulate=true).

Lahko se tudi nastavi začetni datum in uro podano v ISO 8601 formatu (2024-03-14T09:16). Primer: [http://localhost:8080/?room=PR16&simulate=2024-03-14T09:16](http://localhost:8080/?room=PR16&simulate=2024-03-14T09:16).

Za prilagoditev hitrosti simulacije je na voljo tudi parameter `speed`. Primer: [http://localhost:8080?room=P01&simulate=true&speed=20](http://localhost:8080?room=P01&simulate=true&speed=20).

#### Konfiguracija

Konfiguracija aplikacije se periodično osvežuje iz datoteke `public/configuration.json`, dostopne na naslovu [http://localhost:8080/configuration.json](http://localhost:8080/configuration.json).

Konfiguracija je v obliki JSON objekta. Primer: 

```json
{
  "refreshIntervalsInMinutes": {
    "configuration": 5,
    "reservations": 5,
    "teachers": 1440,
    "classrooms": 1440,
    "page": 1440
  },
  "darkMode": {
    "start": 1140,
    "end": 360
  },
  "apiUrl": "https://rezervacije.fri.uni-lj.si",
  "locale": "sl-SI",
  "reasonPattern": "(.*)\\s*\\((.*)\\)_(LV|AV|P)",
  "reasonDisplayFormat": "$1 $3",
  "ipUrl": "ip.php",
  "classroomIpMappings": {
    "192.168.1.101": "P01",
    "192.168.1.102": "P02",
    "192.168.1.103": "P03",
  }
}
```

* `refreshIntervalsInMinutes` določa intervale osveževanja posameznih podatkov v minutah. Ključ `page` se nanaša na osveževanje celotne strani.

* `darkMode` določa časovni interval, ko je vklopljen temni način. Čas je podan v minutah od začetka dneva. Za izklop temnega načina nastavite vsaj eno vrednost na `-1`.

* `apiUrl` določa naslov strežnika, s katerega se pridobivajo podatki o rezervacijah, profesorjih in predavalnicah.

* `locale` določa jezikovno kodo, ki se uporablja za prikazovanje datuma in ure.

* s kombinacijo `reasonPattern` in `reasonDisplayFormat` se določi, kako se prikazuje namen rezervacije. V `reasonPattern` se določi regularni izraz, v `reasonDisplayFormat` pa se nastavi, kako se prikaže namen. Primer: `"(.*?)\\s*\\((.*)\\)_(LV|AV|P)"` in `"$1 $3"`, ki bo za namen `Programiranje 2(63278)_LV` prikazal `Programiranje 2 LV`.

* `ipUrl` določa naslov strežnika, s katerega se pridobiva IP naslov odjemalca. Uporablja se za določanje predavalnice glede na IP naslov. Pričakuje se odgovor v obliki: 
  ```json
  {"ip": "192.168.1.101"}
  ```

* `classroomIpMappings` določa preslikavo med IP naslovi in predavalnicami.
