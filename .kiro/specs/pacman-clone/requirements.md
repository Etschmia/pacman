# Requirements Document

## Introduction

Dieses Dokument beschreibt die Anforderungen für einen modernen Pac-Man-Klon. Das Spiel soll mit Phaser 3 und TypeScript entwickelt werden und einen modernen, glatten visuellen Stil (Flat Design/Neon-Look) aufweisen. Es umfasst 8 Level mit steigendem Schwierigkeitsgrad, dynamische Map-Generierung und Unterstützung für Tastatur- sowie Touch-Steuerung.

## Glossary

- **Pac-Man**: Die vom Spieler gesteuerte Hauptfigur, die Punkte sammelt und Geistern ausweicht
- **Geist (Ghost)**: KI-gesteuerte Gegner, die Pac-Man jagen
- **Pellet**: Kleine Punkte, die Pac-Man zum Abschluss eines Levels sammeln muss
- **Power-Pellet**: Spezielle größere Punkte, die Pac-Man temporär die Fähigkeit geben, Geister zu fressen
- **Frightened Mode**: Zustand der Geister nach Einsammeln eines Power-Pellets, in dem sie fliehen und gefressen werden können
- **Maze**: Das Labyrinth/die Spielkarte, in der sich Pac-Man und Geister bewegen
- **Level**: Eine Spielrunde mit spezifischem Schwierigkeitsgrad und Map-Layout
- **Spawn Point**: Startposition für Pac-Man oder Geister
- **Ghost House**: Zentraler Bereich, in dem Geister spawnen und nach dem Gefressen-werden respawnen
- **Tunnel**: Durchgänge an den Seiten des Mazes, die Pac-Man und Geister zur gegenüberliegenden Seite teleportieren
- **Score**: Punktestand des Spielers
- **Highscore**: Höchster erreichter Punktestand

## Requirements

### Requirement 1: Spieler-Steuerung

**User Story:** Als Spieler möchte ich Pac-Man mit Tastatur und Touch-Gesten steuern können, damit ich das Spiel auf Desktop und mobilen Geräten spielen kann.

#### Acceptance Criteria

1. WHEN der Spieler eine Pfeiltaste oder WASD-Taste drückt THEN the Game SHALL die Bewegungsrichtung von Pac-Man in die entsprechende Richtung ändern
2. WHEN der Spieler eine Swipe-Geste auf einem Touch-Gerät ausführt THEN the Game SHALL die Bewegungsrichtung von Pac-Man entsprechend der Swipe-Richtung ändern
3. WHEN Pac-Man eine neue Richtung erhält und diese Richtung blockiert ist THEN the Game SHALL die Richtungsänderung zwischenspeichern und ausführen, sobald sie möglich wird
4. WHEN Pac-Man sich bewegt und auf eine Wand trifft THEN the Game SHALL Pac-Man stoppen, ohne dass er durch die Wand gleitet
5. WHEN Pac-Man einen Tunnel-Eingang erreicht THEN the Game SHALL Pac-Man zur gegenüberliegenden Seite des Mazes teleportieren

### Requirement 2: Pellet-System

**User Story:** Als Spieler möchte ich Pellets sammeln können, um Punkte zu erhalten und Level abzuschließen.

#### Acceptance Criteria

1. WHEN Pac-Man ein Pellet berührt THEN the Game SHALL das Pellet entfernen und den Score um 10 Punkte erhöhen
2. WHEN Pac-Man ein Power-Pellet berührt THEN the Game SHALL das Power-Pellet entfernen, den Score um 50 Punkte erhöhen und den Frightened Mode aktivieren
3. WHEN alle Pellets in einem Level gesammelt wurden THEN the Game SHALL das Level als abgeschlossen markieren und zum nächsten Level übergehen
4. WHEN ein neues Level startet THEN the Game SHALL alle Pellets entsprechend dem Maze-Layout platzieren

### Requirement 3: Geister-KI und Verhalten

**User Story:** Als Spieler möchte ich gegen intelligente Geister spielen, die unterschiedliche Jagdstrategien verwenden, damit das Spiel herausfordernd und abwechslungsreich ist.

#### Acceptance Criteria

1. WHEN ein Level startet THEN the Game SHALL vier Geister mit unterschiedlichen Persönlichkeiten (Blinky, Pinky, Inky, Clyde) im Ghost House spawnen
2. WHEN ein Geist im Chase-Modus ist THEN the Game SHALL den Geist basierend auf seiner Persönlichkeit ein spezifisches Ziel verfolgen lassen
3. WHEN ein Geist im Scatter-Modus ist THEN the Game SHALL den Geist zu seiner zugewiesenen Ecke des Mazes navigieren lassen
4. WHEN der Frightened Mode aktiviert wird THEN the Game SHALL alle Geister in den Frightened-Zustand versetzen und ihre Bewegungsrichtung umkehren
5. WHEN ein Geist im Frightened-Zustand ist und Pac-Man ihn berührt THEN the Game SHALL den Geist als gefressen markieren und zum Ghost House zurückkehren lassen
6. WHEN ein gefressener Geist das Ghost House erreicht THEN the Game SHALL den Geist respawnen und in den normalen Modus zurückkehren lassen
7. WHILE der Frightened Mode aktiv ist THEN the Game SHALL die verbleibende Zeit visuell anzeigen und die Geister blinken lassen, bevor der Modus endet

### Requirement 4: Kollisionserkennung und Spieler-Tod

**User Story:** Als Spieler möchte ich klares Feedback erhalten, wenn ich von einem Geist gefangen werde, damit ich verstehe, wann und warum ich ein Leben verliere.

#### Acceptance Criteria

1. WHEN Pac-Man einen Geist im normalen Zustand berührt THEN the Game SHALL ein Leben abziehen und eine Todesanimation abspielen
2. WHEN Pac-Man alle Leben verloren hat THEN the Game SHALL den Game-Over-Bildschirm anzeigen
3. WHEN Pac-Man nach einem Tod noch Leben übrig hat THEN the Game SHALL Pac-Man und alle Geister an ihre Startpositionen zurücksetzen
4. WHEN das Spiel startet THEN the Game SHALL dem Spieler 3 Leben zuweisen

### Requirement 5: Level-Progression und Schwierigkeit

**User Story:** Als Spieler möchte ich durch 8 Level mit steigendem Schwierigkeitsgrad spielen, damit das Spiel langfristig herausfordernd bleibt.

#### Acceptance Criteria

1. WHEN ein Level abgeschlossen wird THEN the Game SHALL zum nächsten Level mit erhöhtem Schwierigkeitsgrad übergehen
2. WHEN ein höheres Level startet THEN the Game SHALL die Geschwindigkeit der Geister proportional zum Level erhöhen
3. WHEN ein höheres Level startet THEN the Game SHALL die Dauer des Frightened Mode proportional zum Level verringern
4. WHEN Level 8 abgeschlossen wird THEN the Game SHALL einen Gewinn-Bildschirm anzeigen und das Spiel beenden
5. WHILE ein Level aktiv ist THEN the Game SHALL die aktuelle Levelnummer in der UI anzeigen

### Requirement 6: Dynamische Map-Generierung

**User Story:** Als Spieler möchte ich bei jedem Spieldurchlauf unterschiedliche Maze-Layouts erleben, damit das Spiel wiederspielbar bleibt.

#### Acceptance Criteria

1. WHEN ein neues Spiel gestartet wird THEN the Game SHALL ein Maze-Layout aus einem Pool von mindestens 5 vordefinierten Layouts auswählen oder prozedural generieren
2. WHEN ein Maze generiert wird THEN the Game SHALL sicherstellen, dass alle Bereiche erreichbar sind und keine isolierten Zonen existieren
3. WHEN ein Maze generiert wird THEN the Game SHALL einen gültigen Ghost House in der Mitte platzieren
4. WHEN ein Maze generiert wird THEN the Game SHALL mindestens zwei Tunnel an gegenüberliegenden Seiten platzieren
5. WHEN ein Level-Aufstieg erfolgt THEN the Game SHALL ein neues Maze-Layout für das nächste Level auswählen

### Requirement 7: Visuelles Design und Rendering

**User Story:** Als Spieler möchte ich ein modernes, glattes visuelles Erlebnis haben, das sich von klassischem Pixel-Art abhebt.

#### Acceptance Criteria

1. WHEN das Spiel rendert THEN the Game SHALL alle Spielelemente mit glatten Vektorgrafiken oder Canvas-Primitives darstellen
2. WHEN Pac-Man sich bewegt THEN the Game SHALL eine flüssige Mund-Animation mit mindestens 30 FPS anzeigen
3. WHEN Geister sich bewegen THEN the Game SHALL sanfte Bewegungsanimationen und Farbübergänge anzeigen
4. WHEN der Frightened Mode aktiv ist THEN the Game SHALL die Geister mit einem visuell unterscheidbaren Erscheinungsbild (blau/blinkend) darstellen
5. WHEN das Spiel läuft THEN the Game SHALL einen konsistenten Neon- oder Flat-Design-Stil beibehalten

### Requirement 8: Score-System und UI

**User Story:** Als Spieler möchte ich meinen Punktestand und Spielstatus jederzeit sehen können, damit ich meinen Fortschritt verfolgen kann.

#### Acceptance Criteria

1. WHILE das Spiel läuft THEN the Game SHALL den aktuellen Score permanent sichtbar anzeigen
2. WHILE das Spiel läuft THEN the Game SHALL die verbleibenden Leben als Icons anzeigen
3. WHEN ein neuer Highscore erreicht wird THEN the Game SHALL den Highscore im lokalen Speicher persistieren
4. WHEN das Spiel startet THEN the Game SHALL den gespeicherten Highscore laden und anzeigen
5. WHEN Punkte erzielt werden THEN the Game SHALL eine kurze visuelle Animation am Ort der Punkteerzielung anzeigen

### Requirement 9: Spielzustände und Menüs

**User Story:** Als Spieler möchte ich ein übersichtliches Menüsystem haben, um das Spiel zu starten, zu pausieren und neu zu starten.

#### Acceptance Criteria

1. WHEN das Spiel geladen wird THEN the Game SHALL einen Startbildschirm mit Spieltitel und Start-Button anzeigen
2. WHEN der Spieler die Escape-Taste oder einen Pause-Button drückt THEN the Game SHALL das Spiel pausieren und ein Pause-Menü anzeigen
3. WHEN das Spiel pausiert ist THEN the Game SHALL Optionen zum Fortsetzen und zum Beenden zum Hauptmenü anbieten
4. WHEN der Spieler alle Leben verliert THEN the Game SHALL einen Game-Over-Bildschirm mit finalem Score und Neustart-Option anzeigen
5. WHEN der Spieler Level 8 abschließt THEN the Game SHALL einen Gewinn-Bildschirm mit Gratulation und finalem Score anzeigen

### Requirement 10: Audio-Feedback

**User Story:** Als Spieler möchte ich akustisches Feedback für Spielaktionen erhalten, damit das Spielerlebnis immersiver wird.

#### Acceptance Criteria

1. WHEN Pac-Man ein Pellet sammelt THEN the Game SHALL einen kurzen Sammel-Sound abspielen
2. WHEN Pac-Man ein Power-Pellet sammelt THEN the Game SHALL einen Power-Up-Sound abspielen
3. WHEN Pac-Man einen Geist frisst THEN the Game SHALL einen Erfolgs-Sound abspielen
4. WHEN Pac-Man von einem Geist gefangen wird THEN the Game SHALL einen Todes-Sound abspielen
5. WHEN ein Level abgeschlossen wird THEN the Game SHALL eine Sieges-Melodie abspielen
6. WHERE Audio-Einstellungen verfügbar sind THEN the Game SHALL dem Spieler ermöglichen, Sound stumm zu schalten

### Requirement 11: Responsive Design

**User Story:** Als Spieler möchte ich das Spiel auf verschiedenen Bildschirmgrößen spielen können, damit ich es auf Desktop und mobilen Geräten genießen kann.

#### Acceptance Criteria

1. WHEN das Spielfenster seine Größe ändert THEN the Game SHALL das Spielfeld proportional skalieren
2. WHEN das Spiel auf einem mobilen Gerät läuft THEN the Game SHALL Touch-Steuerung automatisch aktivieren
3. WHEN das Spiel auf einem Desktop läuft THEN the Game SHALL Tastatur-Steuerung als primäre Eingabemethode verwenden
4. WHILE das Spiel läuft THEN the Game SHALL eine Mindest-Framerate von 30 FPS auf unterstützten Geräten aufrechterhalten

### Requirement 12: Daten-Serialisierung

**User Story:** Als Spieler möchte ich meinen Spielfortschritt speichern und laden können, damit ich später weiterspielen kann.

#### Acceptance Criteria

1. WHEN der Spieler das Spiel schließt THEN the Game SHALL den aktuellen Highscore im JSON-Format im lokalen Speicher persistieren
2. WHEN das Spiel startet THEN the Game SHALL gespeicherte Highscore-Daten aus dem lokalen Speicher laden und validieren
3. WHEN gespeicherte Daten geladen werden THEN the Game SHALL die Daten gegen ein definiertes Schema validieren und bei Fehlern Standardwerte verwenden
4. WHEN Spielstand-Daten serialisiert werden THEN the Game SHALL ein konsistentes JSON-Format verwenden, das Deserialisierung ohne Datenverlust ermöglicht
