# Lotteria Bologna JS

Ruota della lotteria a tema Bologna JS, 100% front-end e JavaScript vanilla (nessuna dipendenza, nessun build step).

## Cosa fa

- **Setup**: incolla i nomi (uno per riga) o dettali col microfono (Web Speech API, italiano). I doppioni vengono contati una volta sola.
- **Ruota**: estrazione con `crypto.getRandomValues`, spicchi in palette pastello, tick sonoro e jingle sintetizzato in stile gioco a premi (nessun file audio protetto: le note sono generate con la Web Audio API). Con meno di 12 nomi gli spicchi vengono moltiplicati ripetendo i nomi, così la ruota resta fitta e colorata: ogni nome ha lo stesso numero di spicchi, quindi le probabilità non cambiano.
- **Suspense**: la ruota frena con un'andatura che respira — ogni tanto riprende un po' e poi rallenta di nuovo, senza fermate secche né marce indietro — e atterra esattamente sulla fetta vincente.
- **Vincitori**: ogni estrazione finisce in un recap persistente in `localStorage`; il pulsante "Copia per la chat" produce una lista numerata pronta per Slack/WhatsApp/ecc.
- **Opzioni**: suono on/off, rimozione automatica dei vincitori dall'urna, azzeramento del recap, possibilità di eliminare un singolo vincitore.

## Avvio

È un sito statico: apri `index.html` o servilo con qualsiasi web server.

```bash
python3 -m http.server 3000
# poi apri http://localhost:3000
```

Per il deploy statico basta caricare `index.html`, `style.css`, `app.js` e la cartella `assets/`.

## Note

- La **dettatura** funziona solo in contesti sicuri (`https://` o `localhost`) e su browser con Web Speech API (Chrome, Edge, Safari recenti). In Firefox il pulsante è disabilitato e resta l'inserimento manuale.
- I nomi e il recap restano **solo nel browser** che ospita l'estrazione (`localStorage`, chiave `bjs-lotteria-v1`): non vengono inviati da nessuna parte. Copia il recap prima di cambiare dispositivo o cancellare i dati del browser.
- I suoni partono al primo click (policy di autoplay dei browser). Con `prefers-reduced-motion` la ruota gira meno e i coriandoli sono disattivati.
- Font: Open Sans e JetBrains Mono da Google Fonts, con fallback di sistema.
- Palette e logo seguono l'identità di [bolognajs.com](https://www.bolognajs.com/): nero, giallo `#f3df49`, rosso `#ec1c40`.
