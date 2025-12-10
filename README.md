# Clemi 2.0 - Digitale Stempelpässe

Progressive Web App für Habit-Tracking mit 6 digitalen Stempelpässen und Belohnungssystem.

## Features

- **6 Stempelpässe:**
  - #gyrkewalk (5 Stempel)
  - Sauna (10 Stempel)
  - Fitness (15 Stempel)
  - Bauchumfang (10 Stempel, -1cm = 1 Stempel)
  - Brustumfang (5 Stempel, +1cm = 1 Stempel)
  - Körpergewicht (10 Stempel, -1kg = 1 Stempel)

- **Belohnungssystem:** Dietzie (Bier trinken mit Julia) bei vollem Pass
- **Dark Mode Design:** ADHS/Autismus-optimiert
- **Offline-fähig:** Funktioniert komplett ohne Internet
- **PWA:** Installierbar auf iPad/iPhone Home-Screen

## Schnellstart

### Auf dem iPad/iPhone installieren (empfohlen)

1. Öffne die Datei `index.html` in Safari
2. Tippe auf das Teilen-Icon (Quadrat mit Pfeil)
3. Scrolle nach unten und wähle "Zum Home-Bildschirm"
4. Benenne die App "Clemi 2.0" und tippe "Hinzufügen"
5. Öffne die App vom Home-Bildschirm

### Lokal im Browser testen

Da es eine PWA ist, benötigt sie einen Webserver (nicht einfach Datei öffnen):

```bash
# Python 3
python -m http.server 8000

# Node.js
npx serve

# PHP
php -S localhost:8000
```

Dann öffne: `http://localhost:8000`

## Erste Schritte

1. **Beim ersten Start** erscheint ein Onboarding-Screen
2. Gib deine **Startwerte** ein (Bauchumfang, Brustumfang, Gewicht)
   - Du kannst diese auch überspringen und später in den Einstellungen eingeben
3. **Wische horizontal** oder nutze die Pfeile, um zwischen den 6 Pässen zu navigieren

### Stempel setzen

**Einfache Pässe** (#gyrkewalk, Sauna, Fitness):
- Tippe auf das nächste leere Feld
- Hörst/fühlst du das CHUNK-Feedback
- Stempel erscheint mit Animation

**Mess-Pässe** (Bauchumfang, Brustumfang, Gewicht):
- Tippe "Neuen Messwert eingeben"
- Gib deinen aktuellen Wert ein
- Die App berechnet automatisch, wie viele Stempel du verdient hast
- Stempel werden nacheinander animiert

### Stempel entfernen (Undo)

- **Halte** ein gestempeltes Feld ~0,5 Sekunden gedrückt
- Bestätige die Entfernung
- Funktioniert für alle Passtypen

### Pass abschließen

- Wenn alle Felder gestempelt sind, erscheint eine **Bronze-Medaille**
- Du erhältst **1× Dietzie** (Belohnung)
- Option: Pass neu starten für nächste Runde

### Dietzies einlösen

- Tippe auf das **Bier-Symbol** oben rechts
- Siehst du verfügbare Dietzies und Historie
- "Dietzie einlösen" → Bestätigen
- Genieße dein Bier mit Julia! 🍺

## Einstellungen

Zahnrad-Symbol oben links:

- **Messwerte anpassen:** Startwerte nachträglich ändern
- **Daten exportieren:** Backup als JSON-Datei
- **App zurücksetzen:** Alle Daten löschen (mit doppelter Bestätigung)

## Technologie

- **Vanilla JavaScript** (kein Framework)
- **localStorage** für Datenpersistenz
- **Service Worker** für Offline-Funktionalität
- **Web Audio API** für Sounds
- **Vibration API** für haptisches Feedback

## Dateistruktur

```
clemi-2-0/
├── index.html          # Main HTML
├── manifest.json       # PWA Manifest
├── sw.js              # Service Worker
├── css/
│   └── styles.css     # All styles
├── js/
│   ├── app.js         # Main logic
│   ├── storage.js     # localStorage wrapper
│   ├── passes.js      # Pass/stamp logic
│   ├── dietzies.js    # Reward system
│   └── audio.js       # Sound generation
└── assets/
    └── icons/         # App icons
```

## Datenstruktur

Alle Daten werden in localStorage gespeichert:

- `clemi2_settings` - Startwerte und Setup-Status
- `clemi2_passes` - Alle 6 Pässe mit Stempeln/Messungen
- `clemi2_dietzies` - Verfügbare Dietzies und Historie

### Backup erstellen

1. Öffne Einstellungen
2. Tippe "Daten exportieren"
3. JSON-Datei wird heruntergeladen
4. Bewahre sie sicher auf (z.B. in Cloud oder auf Computer)

### Daten wiederherstellen

Aktuell nur manuell möglich:
1. Öffne Browser-Entwicklertools (Safari: Einstellungen → Erweitert → Web-Inspektor)
2. Console-Tab
3. Füge JSON-Inhalt ein mit: `localStorage.setItem('clemi2_passes', '...')`

## Design-Prinzipien

- **Erwachsene, würdevolle Ästhetik** (keine kindlichen Elemente)
- **Mechanisches, befriedigendes Feedback** (CHUNK-Sound, Vibration)
- **Klare Strukturen und Ordnung** (systematisches Sammeln)
- **Zelda-inspirierte Inventory-Ästhetik** (Karteikarten-Gefühl)
- **Wissenschaftlicher/Forschungs-Touch** (präzise Messwerte)

### Warum diese Design-Entscheidungen?

Die App ist speziell für Menschen mit ADHS/Autismus optimiert:
- **Dunkles Theme:** Weniger visuelle Überstimulation
- **Klare Ordnung:** Vorhersehbare Struktur beruhigt
- **Sammler-Gefühl:** Intrinsische Motivation durch Completionist-Kick
- **Kein Schnickschnack:** Keine ablenkenden Animationen oder Farben
- **Mechanisches Feedback:** Befriedigend, aber nicht überwältigend

## Browser-Kompatibilität

Getestet und unterstützt:

- ✅ iOS Safari 12+
- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Edge 80+

Benötigte Browser-Features:
- localStorage
- Service Worker
- Web Audio API
- Vibration API (optional)
- Touch Events
- CSS Grid

## Offline-Nutzung

Die App funktioniert **komplett offline**:
- Beim ersten Laden werden alle Dateien gecacht
- Service Worker stellt Verfügbarkeit sicher
- Alle Daten werden lokal gespeichert
- Kein Internet nötig nach Installation

## Fehlerbehebung

### App lädt nicht
- Stelle sicher, dass du einen Webserver nutzt (nicht `file://`)
- Prüfe Browser-Konsole auf Fehler
- Lösche Browser-Cache und lade neu

### Stempel werden nicht gespeichert
- Prüfe ob localStorage aktiviert ist (Inkognito-Modus deaktiviert es oft)
- Browser-Einstellungen → Daten/Cookies erlauben

### Kein Sound
- Prüfe Geräte-Lautstärke
- Prüfe ob Browser-Tab nicht stummgeschaltet
- iOS: Klingelton-Schalter muss auf "Klingeln" stehen

### Keine Vibration
- iOS: Nur ab iOS 13+ unterstützt
- Prüfe Geräte-Einstellungen → Töne & Haptik

### Mess-Pass ausgegraut
- Du hast noch keine Startwerte eingegeben
- Öffne Einstellungen und trage sie nach

## Bekannte Einschränkungen

1. **Keine Cloud-Synchronisation** - Daten bleiben nur auf dem Gerät
2. **Keine Mehrbenutzer-Unterstützung** - Ein Gerät = Ein Nutzer
3. **PNG-Icons fehlen** - SVG-Fallback wird genutzt (funktioniert aber)
4. **Kein Daten-Import** - Nur Export möglich

## Zukünftige Erweiterungen (Optional)

Mögliche Features für spätere Versionen:
- Cloud-Sync (Firebase/Supabase)
- Statistiken und Charts
- Erinnerungen/Notifications
- Mehrere Profile
- Daten-Import
- Custom Stamp-Icons
- Lautstärke-Einstellung

## Entwicklung

### Projekt-Setup

Kein Build-Prozess nötig! Einfach:
1. Code editieren
2. Browser neu laden
3. Fertig

### Code-Struktur

- `app.js` - Hauptlogik, UI-Koordination
- `storage.js` - localStorage Abstraktion
- `passes.js` - Stempel-Business-Logic
- `dietzies.js` - Belohnungs-Business-Logic
- `audio.js` - Sound-Generierung

### Service Worker Cache-Update

Bei Code-Änderungen:
1. Ändere `CACHE_NAME` in `sw.js` (z.B. `clemi2-v2`)
2. Browser lädt beim nächsten Besuch neue Version
3. Alte Caches werden automatisch gelöscht

## Credits

- **Konzept & Spec:** Detaillierte Spezifikation
- **Entwicklung:** Progressive Enhancement Approach
- **Design:** ADHS/Autismus-optimiert, Zelda-inspiriert
- **Target User:** Clemens
- **Reward Concept:** Julia (Dietzie = Bier zusammen trinken)

## Lizenz

Privates Projekt für persönliche Nutzung.

---

**Version:** 1.0.0
**Erstellt:** 2025-12-10
**Status:** Production Ready
