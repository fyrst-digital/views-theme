# Unreleased

**Hinweise zum Update**
- Der Produkt-Slider der Erlebniswelten und das Cross-Selling auf der Produktseite verwenden jetzt das Karussell des Themes statt des Shopware-Sliders. Die Slider-Einstellungen für Autoplay, Geschwindigkeit, Rahmen, vertikale Ausrichtung, Darstellungsmodus und Pfeilposition werden nicht mehr verwendet. Template-Anpassungen der inneren `element_product_slider_*`-Blöcke greifen nicht mehr; erweitere stattdessen `Product:Carousel` oder den neuen Block `element_product_slider_carousel`.

**Changelog**
- Neues Produkt-Karussell für den Produkt-Slider und das Cross-Selling: Produkte lassen sich wischen oder scrollen, die Vor-/Zurück-Buttons verschwinden, wenn alle Produkte Platz haben
- Die Browser-Konsole zeigt die Warnung „Init method has to be implemented.“ in Kategorie-Listings und auf anderen Seiten mit Filtern oder dem Newsletter-Formular nicht mehr an

# 1.1.3

**Hinweise zum Update**
- Die JS-Komponente `Navigation:Flyout` (`Flyout.js`) und ihre Open-/Close-Events wurden entfernt. `Navigation:Bar` verwaltet die Flyouts jetzt selbst. Anpassungen, die sich in die Flyout-Komponente eingehängt haben, müssen stattdessen `Navigation:Bar` verwenden.
- Die Route des Navigations-Flyouts akzeptiert nur noch eine 32-stellige hexadezimale Kategorie-ID.

**Changelog**
- Das Navigations-Flyout schließt sich jetzt, wenn du mit der Maus über einen Menüpunkt ohne Flyout oder über leeren Platz in der Leiste fährst
- Produktfilter erscheinen in Kategorie-Listings wieder. CMS-Elemente erhalten wieder den Seitenkontext und bleiben nicht mehr leer, sodass ihr Block nicht mehr ausgeblendet wird

# 1.1.2

**Hinweise zum Update**
- **Verhaltensänderung:** Das Storefront-Logo verwendet die geerbten Storefront-Felder `sw-logo-desktop` / `sw-logo-tablet` / `sw-logo-mobile` nicht mehr. Setze `page-logo` in den Theme-Einstellungen unter Medien. Ist `page-logo` leer, erscheint das mitgelieferte Views-Logo. Favicon und Open-Graph-Bilder bleiben unverändert und nutzen weiter die Storefront-Felder `sw-logo-*`.
- **Entfernt:** die Route `/vi/search/overlay` (`frontend.views-theme.search.overlay`) und das Prop `overlayUrl` von `Search:Action`. Das Such-Overlay wird jetzt mit der Seite ausgeliefert. Anpassungen, die das Overlay über diese Route geändert haben, müssen stattdessen `Search:Overlay` erweitern.

**Changelog**
- Ein leeres `page-logo` zeigt jetzt das mitgelieferte Views-Logo statt des Shopware-Demo-Logos aus `sw-logo-*`
- Die Schrift Figtree wird vorab geladen und startet damit sofort statt erst nach dem Theme-Stylesheet
- Die Produktbildgalerie platziert das Bild nicht mehr falsch, wenn ein Produkt nur ein Bild hat
- Navigations-Schublade, Navigations-Flyout, Vollbild-Galerie, Kategorie-Listing und Kategorie-Filterschublade werden jetzt im HTTP-Cache gespeichert und öffnen sich bei wiederholten Aufrufen schneller
- Die Warenkorb-Schublade öffnet sich sofort beim Klick und zeigt einen Ladeindikator, bis der Warenkorb geladen ist
- Das Such-Overlay öffnet sich sofort, ohne Anfrage an den Server

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
