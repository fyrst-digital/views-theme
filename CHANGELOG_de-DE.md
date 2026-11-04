# 1.1.2

**Hinweise zum Update**
- **Verhaltensänderung:** Das Storefront-Logo verwendet die geerbten Storefront-Felder `sw-logo-desktop` / `sw-logo-tablet` / `sw-logo-mobile` nicht mehr. Setze `page-logo` in den Theme-Einstellungen unter Medien. Ist `page-logo` leer, erscheint das mitgelieferte Views-Logo. Favicon und Open-Graph-Bilder bleiben unverändert und nutzen weiter die Storefront-Felder `sw-logo-*`.

**Changelog**
- Ein leeres `page-logo` zeigt jetzt das mitgelieferte Views-Logo statt des Shopware-Demo-Logos aus `sw-logo-*`
- Die Schrift Figtree wird vorab geladen und startet damit sofort statt erst nach dem Theme-Stylesheet
- Die Produktbildgalerie platziert das Bild nicht mehr falsch, wenn ein Produkt nur ein Bild hat

# 1.1.1

**Changelog**
- Verzögert geladene Overlays, Schubladen, die Adressverwaltung und das Navigations-Flyout öffnen sich beim ersten Klick, auch wenn die Produktions-Assets noch nicht im Cache liegen

# 1.1.0

**Hinweise zum Update**
- Die Theme-Einstellungen wurden umbenannt und neu gruppiert. In Version 1.0.0 gesetzte Farben, Schriften und Logos werden nicht übernommen: Prüfe die Theme-Einstellungen nach dem Update und trage sie erneut ein
- Das Theme hat keine eigenen Logos für Tablet und Mobil, kein Teilen-Icon, kein Favicon und keine Tertiärfarbe mehr
- Storefront- und Administrations-Assets nach dem Update neu bauen und kompilieren

**Changelog**
- Die Theme-Einstellungen sind in die Tabs Farben, Typografie und Medien gruppiert, mit neuen Optionen für Statusfarben, Hintergründe von Header, Seite und Footer, Rahmenfarbe, Eckenradius, Abstände, Icon-Größen, Überschriftengrößen und Breakpoints
- Die Logo-Breite lässt sich für Mobil, Tablet und Desktop getrennt einstellen
- Neu gestalteter Header: Sprach- und Währungswechsel sitzen auf großen Bildschirmen bei den Header-Aktionen
- Neu gestalteter Footer mit Newsletter-Anmeldung, Shop-Adresse und Kontakt-Buttons für Telefon, E-Mail und Kontaktformular (neue Einstellungen für Shop-Informationen)
- Neu gestalteter Cookie-Hinweis und neu gestaltete Cookie-Einstellungen, die sich jetzt in einer Schublade öffnen
- Neu gestalteter Nach-oben-Button
- Neu gestaltete Warenkorbseite mit optionaler Versandkostenberechnung in der Warenkorb-Seitenleiste und der Warenkorb-Schublade (Plugin-Einstellung)
- Registrierung, Bestellbestätigung und Abschlussseite der Kasse nutzen ein gemeinsames Layout, mit Auswahlkarten für Zahlungs- und Versandarten, die Versandpreise anzeigen
- Optionaler Lieferzeitraum in der Zusammenfassung der Kasse (Plugin-Einstellung)
- Adressen werden in der Kasse in einer neu gestalteten Adressverwaltung geändert
- Der minimale Kassen-Header führt zurück zum Warenkorb
- Anmeldung und Registrierung teilen sich eine Seite mit Tabs
- Kunden können ihre Bestellhistorie nach Status und Datum filtern und eine frühere Bestellung wiederholen
- Neu gestaltete Seiten im Kundenkonto
- Neu gestaltete Variantenauswahl auf der Produktseite, mit Hinweis und Lieferhinweis, wenn ein Produkt nicht kaufbar ist
- Überarbeitete Darstellung aktiver Filter und des Filter-Zurücksetzens
- Erlebniswelten: Der Abstand zwischen Sektionen lässt sich im Layout-Editor je Viewport einstellen
- Eigene Einstellungsseite für das Views Theme in der Administration, mit Plugin-Icon und Theme-Vorschaubild
- Neu gestaltete Formularfelder, Checkboxen und Radiobuttons

# 1.0.0

**Changelog**
- Erste stabile Version des ViewsTheme-Storefronts für Shopware 6.7.11 und neuer
- Produktlisting, Produktdetailseite, Warenkorb, Kasse, Kundenkonto und Footer wurden neu gestaltet
- Das Produktlisting enthält Filter, Sortierung und Seitennummerierung
- Die Produktdetailseite enthält eine Bildergalerie, eine Kaufbox und Bewertungen
- Optionales Variantenraster auf der Produktseite, um mehrere Varianten in den Warenkorb zu legen (Plugin-Einstellung)
- Optionales Wunschlieferdatum in der Kasse, das an der Bestellung gespeichert wird (Plugin-Einstellung)
- Der Warenkorb kann in einer Schublade geöffnet und auf einer eigenen Seite bearbeitet werden
- Die Suche öffnet sich als Overlay; die Desktop-Navigation nutzt ein Flyout, die mobile Navigation eine Schublade
- Sprache und Währung können gewechselt werden
- Adressen lassen sich in der Kasse und im Kundenkonto verwalten
- Der Merkzettel wird unterstützt
