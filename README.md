
# ucilnice-prikaz-urnikov

Sistem za prikaz urnikov nad učilnicami.

Originalni avtor, Gregor S., je stran napisal v okviru predmeta Računalništvo v Praksi.

Aplikacija uporablja API [rezervacije.fri.uni-lj.si](https://github.com/gregorjerse/reservations).

## legacy\_php

Da ni bilo treba nikakor popravljati rezervacij, je avtor v aplikacijo dodal proxy, pisan v PHP.

Za nadzor nad klienti je bila dodana podstran s statusom klientov.

To, katera učilnica se prikazuje na katerem klientu, je odvisno od IP naslova klienta.

V rezervacijah so bila namesto imen in priimkov uporabniška imena učiteljev. Aplikacija zato vsebuje
vmesnik, ki se povezuje na strežnik LDAP fakultete in prevaja uporabniška imena v imena in priimke.

## static

Ker prikaz urnikov lahko teče na istem strežniku kot rezervacije, dolga imena učiteljev pa lahko popravimo,
smo velik del funkcionalnosti originalne aplikacije izrezali. Nastale statične strani so sedaj v imeniku static.


# Licensing

This repository may contain multiple copies of various javascript libraries and fonts. The copyright of these components belongs to their respective owners.
