# BolognaJS website

Questo è il repo per il sito https://bolognajs.github.io - https://www.bolognajs.com

## Come contribuire

Forka il repo, modifica quello che vuoi e fai una pull-request :-)

Se ti serve aiuto chiedi pure su [slack](bolognajs.slack.com) sul canale #2018website

## Come creare un nuovo evento

apri il terminale e lancia `npm run addevent` compila i campi richiesti dal configuratore.

## Proprietà del json:
### Date *[input::string]*
Data dell'evento

### Type *[checkbox::array]*
I tipi di evento supportati sono: (scelta multipla)

- **next**: L'evento in arrivo (box stilizzato di rosso)
- **placeholder**: Cella di solo testo (es. Ci rivediamo dopo l'estate)
- **double**: L'evento deve occupare 2 celle nella griglia
- **hands-on**: L'evento richiede l'uso del PC *TODO: grafica specifica per hands-on*

### NumberOfTalks *[input::number]*
Richiede il numero di talk che ci sono nell'evento

### Title *[input::string]*
Titolo dell'evento

### Talks *[input::string]*
Inserire gli speaker del talk nel caso dovessero essere piu di uno separarli dal `;``
Per inserire il link al profilo twitter dello speaker aggiungere fra `[]`il link

es. `"Giorgio Aquino[https://twitter.com/g100g];Davide Fiorello"`
