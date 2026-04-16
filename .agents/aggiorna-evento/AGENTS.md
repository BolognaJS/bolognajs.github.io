# Aggiorna Evento BolognaJS

Aggiorna la pagina `index.html` del sito BolognaJS con il prossimo evento Meetup. Archivia l'evento corrente e inserisce il nuovo. Testa il risultato con un browser, poi committa e pusha.

Usa questo workflow quando l'utente chiede di aggiornare l'evento, aggiungere un nuovo evento, o fornisce un link Meetup per il prossimo meetup BolognaJS.

## Workflow

### Step 1: Chiedi il link Meetup

Se l'utente non ha fornito il link al prossimo evento, chiedilo:

> Qual è il link Meetup del prossimo evento?

### Step 2: Recupera i dati dell'evento

Dal link Meetup, estrai:

- **Titolo** del talk
- **Data** (formattata come `GG Mese AAAA`, mese in italiano per esteso, es. `25 Febbraio 2026`)
- **Speaker** (nome completo)
- **URL Meetup** (link pulito senza query string)

Mappa dei mesi: Gennaio, Febbraio, Marzo, Aprile, Maggio, Giugno, Luglio, Agosto, Settembre, Ottobre, Novembre, Dicembre.

### Step 3: Aggiorna `index.html`

Leggi `index.html` e applica queste modifiche nella sezione `events__grid`:

1. **Declassa l'evento corrente**: il blocco `<a>...<article class="events__event events__event--next">...</article></a>` diventa un semplice `<article class="events__event">` senza il tag `<a>` wrapper e senza la classe `--next`.

2. **Inserisci il nuovo evento** prima dell'evento appena declassato, come nuovo primo elemento della griglia:

```html
<a
  target="_blank"
  href="MEETUP_URL"
  rel="noopener"
>
  <article class="events__event events__event--next">
    <div class="events__event-date">DATA</div>
    <div class="events__content">
      <h3>TITOLO_TALK</h3>
      <span class="events__event-author">by SPEAKER</span>
    </div>
  </article>
</a>
```

Se ci sono più talk nello stesso evento, aggiungi un blocco `events__content` per ciascuno.

### Step 4: Testa con Chrome DevTools MCP

1. **Avvia un live server** sulla root del progetto:

```bash
npx -y live-server --port=5500 --no-browser
```

2. **Naviga alla pagina** nel browser all'URL `http://127.0.0.1:5500`.

3. **Fai screenshot** per verificare visivamente che il nuovo evento sia visibile come prossimo.

4. **Verifica il link** dell'evento prossimo eseguendo nel browser:

```javascript
(() => {
  const nextEvent = document.querySelector('.events__event--next');
  const link = nextEvent?.closest('a');
  return {
    title: nextEvent?.querySelector('h3')?.textContent?.trim(),
    href: link?.href,
    date: nextEvent?.querySelector('.events__event-date')?.textContent?.trim()
  };
})()
```

Controlla che `href` corrisponda al link Meetup fornito dall'utente.

5. **Clicca il link** dell'evento prossimo per verificare che porti alla pagina Meetup corretta.

6. **Ferma il live server** (kill del processo).

### Step 5: Commit e push

Se tutto è OK:

```bash
git add index.html
git commit -m "aggiornamento evento [mese in italiano minuscolo]"
git push
```

Il mese nel commit message è quello dell'evento nuovo, in italiano e minuscolo (es. `aggiornamento evento febbraio`).
