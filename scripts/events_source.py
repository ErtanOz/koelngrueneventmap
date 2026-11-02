# -*- coding: utf-8 -*-
"""Kuratierte Strukturierung der Einträge aus dem Veranstaltungsprogramm 2026.

Jeder Eintrag wurde aus dem PDF-Seitentext übertragen (Seitenangabe in `pages`).
`extract-events.py` prüft anschließend maschinell, dass jedes Datum, jede Uhrzeit,
Telefonnummer und E-Mail-Adresse tatsächlich auf den angegebenen PDF-Seiten steht,
übernimmt die Beschreibungstexte direkt aus dem PDF und liest die Barrierefreiheits-
Piktogramme aus den Vektorgrafiken der Seiten.

Nicht belegte Angaben bleiben `None` (= unbekannt). Es wird nichts ergänzt.
"""

# ---- Kategorien -------------------------------------------------------------
NATUR, WALD, BOTANIK, FUEHR, TIERE, FAMILIE, KULTUR, SONST = (
    "natur", "wald", "botanik", "fuehrungen", "tiere", "familie", "kultur", "sonstige")

# ---- Wiederverwendete Bausteine --------------------------------------------
BG_ORG = "Botanischer Garten (Flora)"
BG_MEET = "Haupteingang (gegenüber Zoo)"
BG_TRANSIT = ["Zoo/Flora (KVB-Linien 18, 140)"]
BG_COST = {"free": False, "adult": 7, "reduced": 4,
           "reducedFor": "Schüler*innen, Studierende, Kinder, Schwerbehinderte, Köln-Pass, NRW-Ehrenamt",
           "note": None}
BG_REG = {"required": True, "deadline": "bis 7 Tage vorher", "email": "anmeldung-botanischergarten@stadt-koeln.de",
          "phone": None, "url": None, "note": "Die Anzahl der Teilnehmenden ist beschränkt."}

GL_ORG = "Gut Leidenhausen, Schutzgemeinschaft Deutscher Wald"
GL_TRANSIT = ["Eil Heumarer Straße (KVB-Linien 151, 152), ca. 20 Minuten Fußweg bis zur Greifvogelschutzstation",
              "Alternativ: Endhaltestelle Linie 9 „Königsforst“, weiter mit RVK-Bus 423 bis Gut Leidenhausen"]
HP_CONTACT = {"name": "Heideportal Gut Leidenhausen e. V.", "phone": "02203 9800541",
              "email": "info@gut-leidenhausen.de", "web": "https://www.gut-leidenhausen.de"}
SDW_CONTACT = {"name": "Schutzgemeinschaft Deutscher Wald Köln e. V.", "phone": "02203 1866494",
               "email": "sdw-nrw-koeln@netcologne.de", "web": None}

FG_TRANSIT = ["Rodenkirchen Bahnhof (KVB-Linien 16, 17, 130, 135)", "Konrad-Adenauer-Straße (KVB-Linie 131)"]
FG_CONTACT = {"name": "Jenny Herling, Finkens Garten", "phone": "0221 2857364",
              "email": "info@finkensgarten.org", "web": None}
FG_NOTE_SPENDE = "Der Förderverein freut sich über Spenden zugunsten der naturpädagogischen Arbeit in Finkens Garten."

FC_ORG = "Fortis Colonia e. V. – Kölner Festungstage 2026"
FC_CONTACT = {"name": "Dr. Henriette Meynen (Koordination Festungstage)", "phone": None,
              "email": "henriette.meynen@web.de", "web": "https://www.fortis-colonia.de"}
FC_REG = {"required": None, "deadline": None, "email": None, "phone": None, "url": None,
          "note": "Terminänderungen und Anmeldebedingungen bitte zusätzlich unter www.fortis-colonia.de prüfen."}

FREE = {"free": True, "adult": None, "reduced": None, "reducedFor": None, "note": None}
NOREG = {"required": False, "deadline": None, "email": None, "phone": None, "url": None, "note": None}
UNKREG = {"required": None, "deadline": None, "email": None, "phone": None, "url": None, "note": None}


def cost_free(note=None):
    return {**FREE, "note": note}


def reg(email=None, deadline=None, phone=None, url=None, note=None):
    return {"required": True, "deadline": deadline, "email": email, "phone": phone, "url": url, "note": note}


def occ(date, start=None, end=None, until=None, approx=False, note=None):
    """Ein Termin. `until` = letzter Tag eines täglich wiederkehrenden Zeitraums (z. B. Ausstellung)."""
    return {"date": date, "start": start, "end": end, "until": until, "approx": approx, "note": note}


EVENTS = []


def add(**kw):
    kw.setdefault("guide", None)
    kw.setdefault("duration", None)
    kw.setdefault("audience", [])
    kw.setdefault("family", False)
    kw.setdefault("maxp", None)
    kw.setdefault("notes", [])
    kw.setdefault("contact", None)
    kw.setdefault("transit", [])
    kw.setdefault("desc_from", None)
    kw.setdefault("desc_to", None)
    kw.setdefault("extra_pages", [])
    kw.setdefault("derived", None)
    kw.setdefault("probe", None)
    EVENTS.append(kw)


# =====================================================================
# BOTANISCHER GARTEN (Flora)
# =====================================================================
add(id="p46-kamelien-ausstellung", title="Kamelien – Fernöstlicher Blütenzauber", kind="Ausstellung",
    pages=[46], venue="flora", cats=[BOTANIK, NATUR], org=BG_ORG,
    summary="Deutschlands größte Kamelien-Sammlung in voller Blüte, täglich im Subtropenhaus und Kamelienwald.",
    desc_from="Deutschlands größte", desc_to="Ausstellungs",
    occ=[occ("2026-01-15", "10:00", "16:00", until="2026-03-29")],
    meet="Botanischer Garten, über Haupteingang, Subtropenhaus und Kamelienwald",
    transit=BG_TRANSIT, cost=cost_free("Der Eintritt ist frei."), reg=UNKREG)

add(id="p47-kamelien-suedostasien", title="Kamelien – Schönheit und Vielfalt aus Südostasien", kind="Themenführung",
    pages=[47], venue="flora", cats=[BOTANIK, FUEHR], org=BG_ORG, guide="Dr. Birgit Werner, Führungsservice des Botanischen Gartens",
    summary="Themenführung über die Kamelien in der Flora.",
    occ=[occ("2026-02-08", "11:00")], meet=BG_MEET, transit=BG_TRANSIT, cost=BG_COST, reg=BG_REG)

add(id="p48-botanische-mittagspause", title="Botanische Mittagspause", kind="Rundgang",
    pages=[48], venue="flora", cats=[BOTANIK, FUEHR], org=BG_ORG, guide="Mitarbeitende des Botanischen Gartens",
    summary="30 Minuten Flora in der Mittagspause: botanische Themen und Geschichten aus dem Garten.",
    desc_from="30-minütiger Rundgang", desc_to="Termin", duration="30 Minuten",
    occ=[occ("2026-02-25", "12:30", "13:00"), occ("2026-04-22", "12:30", "13:00"), occ("2026-08-26", "12:30", "13:00")],
    meet=BG_MEET, transit=BG_TRANSIT, cost=cost_free("Die Teilnahme ist kostenlos."), reg=BG_REG)

add(id="p49-fruehjahrsblueher-kamelien", title="Frühjahrsblüher und Kamelien in der Flora", kind="Themenführung",
    pages=[49], venue="flora", cats=[BOTANIK, FUEHR], org=BG_ORG, guide="Margit Liebich, Führungsservice des Botanischen Gartens",
    summary="Themenführung zu Frühjahrsblühern und Kamelien.",
    occ=[occ("2026-03-08", "11:00")], meet=BG_MEET, transit=BG_TRANSIT, cost=BG_COST, reg=BG_REG)

add(id="p50-kamelientage", title="Kamelientage: Geschichten, Beratung und Teeverkostung", kind="Aktionstage",
    pages=[50], venue="flora", cats=[BOTANIK, KULTUR], org="Freundeskreis Botanischer Garten e. V.",
    guide="Silvia Vermeulen, „Der Fachhandel für Kräuter und Tee“",
    summary="Zwei Aktionstage mit Geschichten, Beratung und Teeverkostung rund um die Kamelie.",
    occ=[occ("2026-03-14", "10:00", "16:00"), occ("2026-03-15", "10:00", "16:00")],
    meet="Botanischer Garten, über Haupteingang", transit=BG_TRANSIT, cost=cost_free("Der Eintritt ist frei."), reg=UNKREG)

add(id="p51-kamelie-pflege-geschichte", title="Alles Wissenswerte über die Kamelie – Pflege, Kultur, Geschichte und Nutzen", kind="Themenführung",
    pages=[51], venue="flora", cats=[BOTANIK, FUEHR], org=BG_ORG, guide="Werner Rösner, Botanischer Garten",
    summary="Themenführung zu Pflege, Kultur, Geschichte und Nutzen der Kamelie.",
    occ=[occ("2026-03-15", "11:00")], meet=BG_MEET, transit=BG_TRANSIT, cost=BG_COST, reg=BG_REG)

add(id="p56-magnolien-kamelien", title="Königinnen der Gehölze und der Winterblüte – Magnolien und Kamelien in der Flora", kind="Themenführung",
    pages=[56], venue="flora", cats=[BOTANIK, FUEHR], org=BG_ORG, guide="Henrike Warlitzer, Führungsservice des Botanischen Gartens",
    summary="Themenführung zu Magnolien und Kamelien.",
    occ=[occ("2026-03-22", "11:00")], meet=BG_MEET, transit=BG_TRANSIT, cost=BG_COST, reg=BG_REG)

add(id="p60-baumrinde", title="Die „Haut“ der Bäume – Funktion, Schönheit und Verwendung der Baumrinde", kind="Themenführung",
    pages=[60], venue="flora", cats=[BOTANIK, WALD, FUEHR], org=BG_ORG, guide="Werner Rösner, Botanischer Garten",
    summary="Themenführung über Baumrinde: Funktion, Schönheit und Verwendung.",
    occ=[occ("2026-04-12", "11:00")], meet=BG_MEET, transit=BG_TRANSIT, cost=BG_COST, reg=BG_REG)

add(id="p67-gartenpflanzen-geschichte", title="Geschichte und Geschichten unserer Gartenpflanzen", kind="Themenführung",
    pages=[67], venue="flora", cats=[BOTANIK, KULTUR, FUEHR], org=BG_ORG, guide="Kirsten Finkel, Botanischer Garten",
    summary="Themenführung über die Herkunft und Geschichte von Gartenpflanzen.",
    occ=[occ("2026-04-26", "11:00")], meet=BG_MEET, transit=BG_TRANSIT, cost=BG_COST, reg=BG_REG)

add(id="p76-goetter-baeume", title="Die Götter in Verbindung mit den Bäumen – heilig und verehrt", kind="Familienführung",
    pages=[76], venue="flora", cats=[BOTANIK, FAMILIE, KULTUR, FUEHR], org=BG_ORG, guide="Dr. Birgit Werner, Führungsservice des Botanischen Gartens",
    summary="Familienführung über heilige und verehrte Bäume.",
    family=True, audience=["Familien"],
    occ=[occ("2026-05-10", "11:00")], meet=BG_MEET, transit=BG_TRANSIT, cost=BG_COST, reg=BG_REG)

add(id="p78-lenne-flora", title="Auf den Spuren von Peter Josef Lenné – Floragründung und die historischen Gartenteile", kind="Themenführung",
    pages=[78], venue="flora", cats=[BOTANIK, KULTUR, FUEHR], org=BG_ORG, guide="Henrike Warlitzer, Führungsservice des Botanischen Gartens",
    summary="Themenführung zur Gründung der Flora und ihren historischen Gartenteilen.",
    occ=[occ("2026-05-31", "11:00")], meet=BG_MEET, transit=BG_TRANSIT, cost=BG_COST, reg=BG_REG)

add(id="p82-superkraefte-pflanzen", title="Die geheimen Superkräfte der Pflanzen", kind="Familienführung",
    pages=[82], venue="flora", cats=[BOTANIK, FAMILIE, FUEHR], org=BG_ORG, guide="Annika Horstick, Führungsservice des Botanischen Gartens",
    summary="Familienführung über die erstaunlichen Fähigkeiten von Pflanzen.",
    family=True, audience=["Familien"],
    occ=[occ("2026-06-14", "11:00")], meet=BG_MEET, transit=BG_TRANSIT, cost=BG_COST, reg=BG_REG)

add(id="p86-tropischer-zauber", title="Tropischer Zauber im Innenhof der Schaugewächshäuser", kind="Themenführung",
    pages=[86], venue="flora", cats=[BOTANIK, FUEHR], org=BG_ORG, guide="Henrike Warlitzer, Führungsservice des Botanischen Gartens",
    summary="Themenführung im Innenhof der neuen Schaugewächshäuser.",
    occ=[occ("2026-06-28", "11:00")], meet=BG_MEET, transit=BG_TRANSIT, cost=BG_COST, reg=BG_REG)

add(id="p87-feierabendrundgang", title="Feierabendrundgang durch die Botanik", kind="Rundgang",
    pages=[87], venue="flora", cats=[BOTANIK, FUEHR], org=BG_ORG, guide="Henrike Warlitzer und Dr. Birgit Werner, Führungsservice des Botanischen Gartens",
    summary="45-minütiger Rundgang nach Feierabend durch Pflanzen- und Tierwelt der Flora.",
    desc_from="Wenn Sie tagsüber keine Zeit", desc_to="Termine", duration="45 Minuten",
    occ=[occ("2026-06-30", "18:00", "18:45"), occ("2026-07-21", "18:00", "18:45"),
         occ("2026-09-08", "18:00", "18:45"), occ("2026-10-06", "18:00", "18:45")],
    meet=BG_MEET, transit=BG_TRANSIT, cost=cost_free("Die Teilnahme ist kostenlos."), reg=BG_REG)

add(id="p108-fruechtetee-workshop", title="Der König der Bären – Früchtetee Workshop", kind="Kinderführung",
    pages=[108], venue="flora", cats=[BOTANIK, FAMILIE, FUEHR], org="Freundeskreis Botanischer Garten e. V.",
    guide="Silvia Vermeulen, „Der Fachhandel für Kräuter und Tee“",
    summary="Kinderführung mit Früchtetee-Workshop.",
    family=True, audience=["Kinder"],
    occ=[occ("2026-07-19", "11:00")], meet=BG_MEET, transit=BG_TRANSIT, cost=BG_COST, reg=BG_REG)

add(id="p109-dahlienpracht", title="Dahlienpracht im Botanischen Garten", kind="Ausstellung",
    pages=[109], venue="flora", cats=[BOTANIK, NATUR], org=BG_ORG,
    summary="Rund 500 Dahlien in 100 Sorten mit tausenden Blüten, auch der Sorte „Flora Köln“.",
    desc_from="Die Dahliensammlung", desc_to="Ausstellungs",
    occ=[occ("2026-07-15", None, None, until="2026-09-30", approx=True,
             note="Zeitraum laut Programm „ungefähr 15. Juli bis circa 30. September“; Uhrzeiten nicht angegeben.")],
    meet="Botanischer Garten, über Eingang Amsterdamer Straße/Sommerblumen",
    transit=["Kinderkrankenhaus (KVB-Linie 16)"], cost=cost_free("Der Eintritt ist frei."), reg=UNKREG)

add(id="p111-essbare-bluten", title="Essbare Blüten in der Flora", kind="Themenführung",
    pages=[111], venue="flora", cats=[BOTANIK, FUEHR], org=BG_ORG, guide="Anja Schneider, Botanischer Garten",
    summary="Themenführung über essbare Blüten.",
    occ=[occ("2026-07-26", "11:00")], meet=BG_MEET, transit=BG_TRANSIT, cost=BG_COST, reg=BG_REG)

add(id="p112-likoere", title="Liköre – „Kräuter-Geister“ aus dem Garten", kind="Themenführung",
    pages=[112], venue="flora", cats=[BOTANIK, FUEHR], org="Freundeskreis Botanischer Garten e. V.",
    guide="Silvia Vermeulen, „Der Fachhandel für Kräuter und Tee“",
    summary="Themenführung über Kräuter und Liköre aus dem Garten.",
    occ=[occ("2026-08-02", "11:00")], meet=BG_MEET, transit=BG_TRANSIT, cost=BG_COST, reg=BG_REG)

add(id="p114-gruene-apotheke", title="Die grüne Apotheke – Arznei- und Heilpflanzen in der Flora", kind="Themenführung",
    pages=[114], venue="flora", cats=[BOTANIK, FUEHR], org=BG_ORG, guide="Anja Schneider, Botanischer Garten",
    summary="Themenführung über Arznei- und Heilpflanzen.",
    occ=[occ("2026-08-09", "11:00")], meet=BG_MEET, transit=BG_TRANSIT, cost=BG_COST, reg=BG_REG)

add(id="p120-pfeffer", title="Wo der Pfeffer wächst … die alltägliche Schärfe", kind="Themenführung",
    pages=[120], venue="flora", cats=[BOTANIK, FUEHR], org="Freundeskreis Botanischer Garten e. V.",
    guide="Silvia Vermeulen, „Der Fachhandel für Kräuter und Tee“",
    summary="Themenführung über Pfeffer und andere Schärfe-Lieferanten.",
    occ=[occ("2026-08-23", "11:00")], meet=BG_MEET, transit=BG_TRANSIT, cost=BG_COST, reg=BG_REG)

add(id="p133-pflanzenwelt-amerikas", title="Die Pflanzenwelt Amerikas", kind="Themenführung",
    pages=[133], venue="flora", cats=[BOTANIK, FUEHR], org=BG_ORG, guide="Arne Seringer, Botanischer Garten",
    summary="Themenführung durch die Pflanzenwelt Amerikas.",
    occ=[occ("2026-09-20", "11:00")], meet=BG_MEET, transit=BG_TRANSIT, cost=BG_COST, reg=BG_REG)

add(id="p135-tropische-anpassungen", title="Die Anpassungen tropischer Pflanzen an ihren Lebensraum", kind="Themenführung",
    pages=[135], venue="flora", cats=[BOTANIK, FUEHR], org=BG_ORG, guide="Arne Seringer, Botanischer Garten",
    summary="Themenführung über Anpassungen tropischer Pflanzen.",
    occ=[occ("2026-10-11", "11:00")], meet=BG_MEET, transit=BG_TRANSIT, cost=BG_COST, reg=BG_REG)

add(id="p137-weihrauch-myrrhe", title="Kostbarkeiten aus dem Orient – Weihrauch, Myrrhe, Harze und Balsame", kind="Themenführung",
    pages=[137], venue="flora", cats=[BOTANIK, KULTUR, FUEHR], org="Freundeskreis Botanischer Garten e. V.",
    guide="Silvia Vermeulen, „Der Fachhandel für Kräuter und Tee“",
    summary="Themenführung über Weihrauch, Myrrhe, Harze und Balsame.",
    occ=[occ("2026-10-25", "11:00")], meet=BG_MEET, transit=BG_TRANSIT, cost=BG_COST, reg=BG_REG)

# =====================================================================
# FORST / WALD (Forstverwaltung, Schutzgemeinschaft Deutscher Wald)
# =====================================================================
add(id="p53-worringer-bruch", title="Worringer Bruch – Wildnis in der Großstadt", kind="Führung",
    pages=[53], venue="worringer-bruch", cats=[WALD, NATUR, FUEHR], org="Forst (Forstverwaltung der Stadt Köln)",
    guide="Michael Hundt, Förster", summary="Führung durch das einzige „Urwald“-Naturschutzgebiet Kölns zum Internationalen Tag des Waldes.",
    desc_from="Ein Waldnaturschutzgebiet", desc_to="Termin",
    occ=[occ("2026-03-20", "16:00")], meet="Kreuzung Senfweg/Ecke Bruchstraße, Köln-Worringen",
    transit=["Worringen S-Bahn (KVB-Linie 120, S-Bahn-Linie 11)"], cost=cost_free("Die Teilnahme ist kostenlos."), reg=NOREG,
    contact={"name": "Michael Hundt, Förster", "phone": "0221 799520", "email": "michael.hundt@stadt-koeln.de", "web": None},
    notes=["Festes Schuhwerk wird benötigt."])

add(id="p54-radtour-duennwalder-wald", title="Internationaler Tag des Waldes – Fahrradtour: Der Dünnwalder Wald", kind="Radtour",
    pages=[54, 55], venue="waldbad-duennwald", cats=[WALD, NATUR, FUEHR], org="Forst (Forstverwaltung der Stadt Köln)",
    guide="Jörn Anlauf, Förster", summary="Rund 4 km mit dem Rad durch den Dünnwalder Wald: Klimawandel, Waldumbau und Erholungsnutzung.",
    desc_from="Bei dieser Fahrradtour", desc_to="Termin",
    occ=[occ("2026-03-21", "14:00")], meet="Eingang am Waldbad Dünnwald",
    transit=["Dünnwald Waldbad (KVB-Linie 154)", "Leuchterstraße (KVB-Linien 4, 154, 155, 157)"],
    cost=cost_free("Die Teilnahme ist kostenlos."), reg=NOREG,
    contact={"name": "Jörn Anlauf, Förster", "phone": "0221 601307", "email": None, "web": None},
    notes=["Streckenlänge der Fahrradtour etwa 4 Kilometer."])

add(id="p62-astskulpturen", title="Lebendiges Museum: Wachsende Astskulpturen", kind="Workshop",
    pages=[62, 63], extra_pages=[26], venue="gut-leidenhausen", cats=[KULTUR, WALD, FAMILIE], org=GL_ORG, guide="Cordula Körber und N.N",
    summary="Workshop im Haus des Waldes: gemeinsam mit einer Künstlerin Astobjekte bauen – für Jung und Alt.",
    desc_from="In der neu eröffneten Ausstellung", desc_to="Termin", family=True, audience=["Jung und Alt"],
    occ=[occ("2026-04-12", "11:00", "16:00"), occ("2026-05-10", "11:00", "16:00")],
    meet="Gut Leidenhausen, Haus des Waldes/Waldschule", transit=GL_TRANSIT,
    cost=cost_free("Die Teilnahme ist kostenlos."), reg=NOREG, contact=SDW_CONTACT)

add(id="p64-stadtnatur-siebenhuegelpark", title="Stadtnatur – Beobachten und Entdecken", kind="Führung",
    pages=[64], venue="siebenhuegelpark-vogelsang", cats=[NATUR, FUEHR], org="Amt für Landschaftspflege und Grünflächen",
    guide="Gerhard Stricker, Amt für Landschaftspflege und Grünflächen",
    summary="Rundgang durch den Kölner StadtNaturPark Siebenhügelpark: wie Grünflächen zu Lebensräumen werden.",
    desc_from="Entdecken Sie die Vielfalt", desc_to="Termin",
    occ=[occ("2026-04-24", "15:00")], meet="Biesterfeld, Vogelsang",
    transit=["Wolffsohnstraße (KVB-Linien 3, 4)"], cost=cost_free("Die Teilnahme ist kostenlos."),
    reg=reg(email="gerhard.stricker@stadt-koeln.de"),
    contact={"name": "Gerhard Stricker", "phone": "0221 221-38408", "email": "gerhard.stricker@stadt-koeln.de", "web": None},
    notes=["Als Treffpunkt nennt das Programm die Koordinaten 50.96203885686808, 6.885012816188752 (Google Maps)."])

add(id="p65-stadtgaertnerei-kulissen", title="Stadtgärtnerei: Ein Blick hinter die Kulissen", kind="Führung",
    pages=[65], extra_pages=[34, 35], venue="stadtgaertnerei", cats=[NATUR, FUEHR], org="Stadtgärtnerei Köln",
    guide="Moritz Pfister, Leiter der Stadtgärtnerei",
    summary="Einmal im Jahr öffnet die Stadtgärtnerei ihre Tore: Einblick in die Arbeit der Gärtner*innen.",
    desc_from="Einmal im Jahr öffnet", desc_to="Termin",
    occ=[occ("2026-04-25", "10:00"), occ("2026-04-25", "11:30")],
    meet="Stadtgärtnerei, Am Grauen Stein 26, 51105 Köln-Poll", transit=["Raiffeisenstraße (KVB-Linie 7)"],
    cost=cost_free("Die Führung ist kostenlos."), reg=NOREG,
    contact={"name": "Stadtgärtnerei Köln", "phone": "0221 833413", "email": "stadtgaertnerei@stadt-koeln.de", "web": None})

add(id="p66-weisser-rheinbogen", title="Weißer Rheinbogen", kind="Wanderung",
    pages=[66], venue="rodenkirchen-uferstrasse", cats=[WALD, NATUR, FUEHR], org="Forst (Forstverwaltung der Stadt Köln)",
    guide="Dennis Remiger, städtische Forstverwaltung",
    summary="Wanderung durch das größte Auenwaldgebiet Kölns mit einem Forstwirtschaftsmeister.",
    desc_from="Auenwälder am Rhein", desc_to="Termin", maxp=None,
    occ=[occ("2026-04-25", "10:00")], meet="Uferstraße, Parkplatz am Minigolfplatz, Köln-Rodenkirchen",
    transit=["Rodenkirchen Uferstraße (KVB-Linie 135)"], cost=cost_free("Die Teilnahme ist kostenlos."),
    reg={"required": True, "deadline": "bis 24. April 2026", "email": None, "phone": None, "url": None,
         "note": "Die Anzahl der Teilnehmenden ist beschränkt. Meldeweg im Programm nicht ausdrücklich genannt – bitte über den Kontakt anmelden."},
    contact={"name": "Dennis Remiger, Forstrevier Rodenkirchen", "phone": "0221 352575",
             "email": "forstrevier-rodenkirchen@stadt-koeln.de", "web": None})

add(id="p68-wahner-heide-tag", title="Wahner-Heide-Tag", kind="Fest",
    pages=[68, 69], venue="gut-leidenhausen", cats=[NATUR, TIERE, FAMILIE], org="Gut Leidenhausen (Portalverein)",
    summary="Wahner-Heide-Fest mit Umweltgottesdienst, Infoständen vieler Vereine und Musik.",
    desc_from="Seit 1986", desc_to="Termin",
    occ=[occ("2026-05-01", "11:00", "17:00")], meet="Umweltbildungszentrum Gut Leidenhausen, Gut Leidenhausen 1, 51147 Köln-Porz",
    transit=GL_TRANSIT, cost=cost_free("Die Teilnahme ist kostenlos."), reg=NOREG, contact=HP_CONTACT)

add(id="p70-waldlabor-mai", title="Führung durch das Waldlabor", kind="Führung",
    pages=[70], venue="waldlabor", cats=[WALD, NATUR, FUEHR], org="Forst (Forstverwaltung der Stadt Köln)",
    guide="Michael Hundt, Förster", summary="Welche Baumarten spielen im Wald der Zukunft eine Rolle? Experimentierfeld Waldlabor.",
    desc_from="In dem Experimentierfeld", desc_to="Termin",
    occ=[occ("2026-05-05", "17:00")], meet="Waldlabor an der Bachemer Landstraße/Ecke Stüttgenweg, Köln-Junkersdorf",
    transit=["Stüttgenhof (KVB-Linie 7)"], cost=cost_free("Die Teilnahme ist kostenlos."), reg=NOREG,
    contact={"name": "Michael Hundt, Förster", "phone": "0221 799520", "email": "michael.hundt@stadt-koeln.de", "web": None})

add(id="p72-radfuehrung-teil1", title="Ab in den Wald: Radführung durch den äußeren Wald- und Wiesengürtel, Teil I rechtsrheinisch", kind="Radtour",
    pages=[72, 73], venue="hst-westhoven", cats=[WALD, KULTUR, FUEHR], org=GL_ORG, guide="Dr. Joachim Bauer",
    summary="Radtour entlang des Äußeren Grüngürtels (rechtsrheinisch): Geschichte, Besonderheiten und Waldzusammensetzung.",
    desc_from="Der äußere Wald- und Wiesengürtel", desc_to="Termin", duration="ca. 4 Stunden",
    family=True, audience=["Erwachsene", "Erwachsene mit Kindern"], maxp=20,
    occ=[occ("2026-05-09", "12:00", "16:00", approx=True, note="Ende laut Programm „ungefähr 16 Uhr“.")],
    meet="KVB-Haltestelle Westhoven/Kölner Straße", transit=["Westhoven/Kölner Straße (KVB-Linie 7)"],
    cost=cost_free("Die Teilnahme ist kostenlos."), reg=reg(email="sdw-nrw-koeln@netcologne.de", phone="02203 1866494",
                                                           note="Anmeldung per E-Mail oder telefonisch. Maximal 20 Personen."),
    contact={**SDW_CONTACT, "email": "sdw-nrw-koeln@netcologne.de"}, notes=["Hunde sind bei dieser Veranstaltung nicht erlaubt."])

add(id="p80-stadtwald", title="Führung durch den Stadtwald", kind="Führung",
    pages=[80], venue="stadtwald-duerener", cats=[WALD, KULTUR, FUEHR], org="Schutzgemeinschaft Deutscher Wald",
    guide="Dr. Joachim Bauer", summary="Geschichte und Besonderheiten des ab 1895 angelegten Kölner Stadtwalds.",
    desc_from="Der Stadtwald wurde ab 1895", desc_to="Termine",
    occ=[occ("2026-06-12", "16:00", "18:00")], meet="Stadtwald Dürener Straße/Stadtwaldgürtel", transit=[],
    cost=cost_free("Die Teilnahme ist kostenlos."), reg=NOREG,
    contact={**SDW_CONTACT, "phone": None})

add(id="p122-arboreten", title="Führung: Arboreten in Köln – Arboretum Äußerer Grüngürtel", kind="Führung",
    pages=[122, 123], extra_pages=[26], venue="hst-stuettgenhof", cats=[WALD, NATUR, FUEHR], org=GL_ORG, guide="Dr. Joachim Bauer",
    summary="Führung durch das Arboretum im Äußeren Grüngürtel mit fremdländischen Baumarten.",
    desc_from="Aufgrund von archäologischen", desc_to="Termin", family=True, audience=["Erwachsene mit Kindern"],
    occ=[occ("2026-09-04", "16:00")], meet="KVB-Haltestelle Stüttgenhof", transit=["Stüttgenhof (KVB-Linie 7)"],
    cost=cost_free("Die Teilnahme ist kostenlos."), reg=NOREG, contact=SDW_CONTACT,
    notes=["Hunde können bei dieser Veranstaltung mitgenommen werden.",
           "Die Veranstaltung findet in Zusammenarbeit mit dem Verein der Freunde und Förderer des Lindenthaler Tierparks e. V. und der Kölner Grünstiftung statt."])

add(id="p126-waldlabor-sept", title="Waldlabor", kind="Führung",
    pages=[126], venue="waldlabor", cats=[WALD, NATUR, FUEHR], org="Forst (Forstverwaltung der Stadt Köln)",
    guide="Michael Hundt, Förster", summary="Welche Baumarten spielen im Wald der Zukunft eine Rolle? Führung durch das Waldlabor.",
    desc_from="In dem einmaligen Experimentierfeld", desc_to="Termin",
    occ=[occ("2026-09-08", "17:00")], meet="Waldlabor an der Bachemer Landstraße/Ecke Stüttgenweg",
    transit=["Stüttgenhof (KVB-Linie 7)"], cost=cost_free("Die Teilnahme ist kostenlos."), reg=NOREG,
    contact={"name": "Michael Hundt, Förster", "phone": "0221 799520", "email": "michael.hundt@stadt-koeln.de", "web": None})

add(id="p127-radfuehrung-teil2", title="Radführung durch den äußeren Wald- und Wiesengürtel, Teil II, linksrheinisch", kind="Radtour",
    pages=[127], venue="hst-wilhelm-sollmann", cats=[WALD, KULTUR, FUEHR], org=GL_ORG, guide="Dr. Joachim Bauer",
    summary="Radtour entlang des Äußeren Grüngürtels (linksrheinisch): Geschichte, Besonderheiten und Waldzusammensetzung.",
    desc_from="Der äußere Wald- und Wiesengürtel", desc_to="Termin", duration="ca. 4 Stunden",
    family=True, audience=["Erwachsene", "Erwachsene mit Kindern"], maxp=20,
    occ=[occ("2026-09-12", "12:00", "16:00", approx=True, note="Ende laut Programm „ungefähr 16 Uhr“.")],
    meet="KVB-Haltestelle Wilhelm-Sollmann-Straße", transit=["Wilhelm-Sollmann-Straße (KVB-Linien 12, 15)"],
    cost=cost_free("Die Teilnahme ist kostenlos."), reg=reg(email="sdw-nrw-koeln@netcologne.de", phone="02203 1866494",
                                                           note="Anmeldung per E-Mail oder telefonisch. Maximal 20 Personen."),
    contact={**SDW_CONTACT, "email": "sdw-nrw-koeln@netcologne.de"}, notes=["Hunde sind bei dieser Veranstaltung nicht erlaubt."])

add(id="p134-gruenguertel-waldlabor", title="Führung: Der Wald des äußeren Grüngürtels und das Waldlabor", kind="Führung",
    pages=[134], extra_pages=[26], venue="haus-am-see", cats=[WALD, FUEHR], org=GL_ORG, guide="Dr. Joachim Bauer",
    summary="Wie wurde der 100 Jahre alte Wald des Grüngürtels angelegt? Anschließend Besuch im Waldlabor.",
    desc_from="Der Äußere Grüngürtel wurde", desc_to="Termin",
    occ=[occ("2026-09-25", "16:00", "18:00")], meet="Parkplatz Haus am See, Decksteiner Weiher",
    transit=["Stüttgenhof (KVB-Linie 7)"], cost=cost_free("Die Teilnahme ist kostenlos."),
    reg=reg(email="sdw-nrw-koeln@netcologne.de", phone="02203 1866494", note="Anmeldung per E-Mail oder telefonisch."),
    contact={**SDW_CONTACT, "email": None})

# =====================================================================
# FINKENS GARTEN (Naturerlebnisgarten, Rodenkirchen)
# =====================================================================
FG_KID_NOTE = [FG_NOTE_SPENDE]
add(id="p57-fg-fuehrung-3-6", title="Offene Führung für Drei- bis Sechsjährige durch den Naturerlebnisgarten", kind="Führung",
    pages=[57], venue="finkens-garten", cats=[FAMILIE, NATUR, FUEHR], org="Finkens Garten", guide="Hauptamtliches Team, Finkens Garten",
    summary="Frühlingsentdeckungen mit allen Sinnen für Kinder von 3 bis 6 Jahren, in Begleitung von Eltern oder Großeltern.",
    desc_from="Die Kinder erfahren mit allen Sinnen", desc_to="Termin", family=True, audience=["Kinder 3–6 Jahre mit Eltern/Großeltern"],
    occ=[occ("2026-03-31", "14:30", "16:00")], meet="Eingangstor Finkens Garten", transit=FG_TRANSIT,
    cost=cost_free("Die Teilnahme ist kostenlos."), reg=NOREG, contact=FG_CONTACT, notes=FG_KID_NOTE)

add(id="p58-fg-fuehrung-6-10", title="Offene Führung für Sechs- bis Zehnjährige durch den Naturerlebnisgarten", kind="Führung",
    pages=[58], venue="finkens-garten", cats=[FAMILIE, NATUR, FUEHR], org="Finkens Garten", guide="Hauptamtliches Team, Finkens Garten",
    summary="Frühlingsentdeckungen mit allen Sinnen für Kinder von 6 bis 10 Jahren, in Begleitung von Eltern oder Großeltern.",
    desc_from="Die Kinder erfahren mit allen Sinnen", desc_to="Termin", family=True, audience=["Kinder 6–10 Jahre mit Eltern/Großeltern"],
    occ=[occ("2026-04-07", "14:30", "16:00")], meet="Eingangstor Finkens Garten", transit=FG_TRANSIT,
    cost=cost_free("Die Teilnahme ist kostenlos."), reg=NOREG, contact=FG_CONTACT, notes=FG_KID_NOTE)

add(id="p59-fg-gemuese-aussaat", title="Ausgerechnet Gemüse 1 – Aussaat", kind="Workshop",
    pages=[59], venue="finkens-garten", cats=[FAMILIE, NATUR], org="Finkens Garten", guide="Jenny Herling, Gartenleitung",
    summary="Gemüse aussäen, Keimlinge kennenlernen und einen kleinen Snack zubereiten (Kinder 6–10 Jahre).",
    desc_from="Gemüse muss nicht langweilig sein", desc_to="Termin", family=True, audience=["Kinder 6–10 Jahre"], maxp=10,
    occ=[occ("2026-04-09", "11:00", "15:00")], meet="Eingangstor Finkens Garten", transit=FG_TRANSIT,
    cost=cost_free("Die Teilnahme ist kostenlos."), reg=reg(email="info@finkensgarten.org", note="Maximal zehn Kinder."),
    contact={"name": "Jenny Herling, Gartenleitung", "phone": "0173 8895185", "email": "jenny.herling@finkensgarten.org", "web": None},
    notes=FG_KID_NOTE)

add(id="p75-fg-bienentag", title="Bienentag", kind="Aktionstag",
    pages=[75], venue="finkens-garten", cats=[TIERE, NATUR, FAMILIE], org="Kölner Imkerverein von 1882 e. V. (in Finkens Garten)",
    summary="Info- und Aktionstag für die ganze Familie rund um die Honigbiene mit Honigverkostung und Bastelaktionen.",
    desc_from="Info- und Aktionstag", desc_to="Termin", family=True, audience=["Familien"],
    occ=[occ("2026-05-10", "13:00", "17:00")], meet="Am Bienenhaus", transit=FG_TRANSIT,
    cost=cost_free("Die Teilnahme ist kostenlos."), reg=NOREG,
    contact={"name": "Vorstand Kölner Imkerverein von 1882 e. V.", "phone": "0177 7750308",
             "email": "vorstand@koelner-imkerverein.de", "web": "https://www.koelner-imkerverein.de"},
    notes=["Telefonisch erreichbar Montag bis Freitag, 10 bis 12 Uhr."])

add(id="p77-fg-kraeuter", title="Kräuter-Werkstatt für Sechs- bis Zehnjährige", kind="Workshop",
    pages=[77], venue="finkens-garten", cats=[FAMILIE, NATUR], org="Finkens Garten", guide="Kräuterpädagogisches Team in Finkens Garten",
    summary="Küchen- und Wildkräuter sammeln, verarbeiten und gemeinsam essen (Kinder 6–10 Jahre).",
    desc_from="Wir sammeln Küchen- und Wildkräuter", desc_to="Termin", family=True, audience=["Kinder 6–10 Jahre"], maxp=10,
    occ=[occ("2026-05-24", "11:00", "15:00")], meet="Eingangstor Finkens Garten", transit=FG_TRANSIT,
    cost=cost_free("Die Teilnahme ist kostenlos."), reg=reg(email="info@finkensgarten.org", note="Maximal zehn Kinder."),
    contact=FG_CONTACT, notes=FG_KID_NOTE)

add(id="p104-fg-eisvogel", title="Blau machen wie der Eisvogel", kind="Kreativ-Workshop",
    pages=[104, 105], venue="finkens-garten", cats=[FAMILIE, TIERE, NATUR], org="Finkens Garten", guide="Sabine Schramm, Kunstpädagogin",
    summary="Malen und Kleben rund um den Eisvogel, der sein Nest aus allem Blauen baut (Kinder 7–12 Jahre).",
    desc_from="Der Eisvogel ist ein kleiner Vogel", desc_to="Termin", family=True, audience=["Kinder 7–12 Jahre"], maxp=6,
    occ=[occ("2026-07-14", "16:00", "18:00"), occ("2026-09-08", "16:00", "18:00")],
    meet="Eingangstor Finkens Garten", transit=FG_TRANSIT, cost=cost_free("Die Teilnahme ist kostenlos."),
    reg=reg(email="kunstkurse@yahoo.com", note="Maximal sechs Kinder."), contact=FG_CONTACT, notes=FG_KID_NOTE)

add(id="p106-fg-naturerlebnis-3-6", title="Naturerlebnis für Kinder von drei bis sechs Jahren mit ihren Eltern", kind="Naturerlebnis",
    pages=[106, 107], venue="finkens-garten", cats=[FAMILIE, NATUR], org="Finkens Garten", guide="Hauptamtliches Team, Finkens Garten",
    summary="Kinder und ihre Bezugspersonen erforschen gemeinsam die Natur mit allen Sinnen.",
    desc_from="Die Erwachsenen werden angeregt", desc_to="Termin", family=True,
    audience=["Kinder 3–6 Jahre mit je einer erwachsenen Bezugsperson"], maxp=10,
    occ=[occ("2026-07-15", "14:30", "16:00")], meet="Eingangstor Finkens Garten", transit=FG_TRANSIT,
    cost=cost_free("Die Teilnahme ist kostenlos."), reg=reg(email="info@finkensgarten.org", note="Maximal zehn Kinder mit je einer erwachsenen Bezugsperson."),
    contact=FG_CONTACT, notes=FG_KID_NOTE + ["Die Kleidung sollte schmutzig werden dürfen."])

add(id="p118-fg-gemuese-ernte", title="Ausgerechnet Gemüse 2 – Ernte", kind="Workshop",
    pages=[118], venue="finkens-garten", cats=[FAMILIE, NATUR], org="Finkens Garten", guide="Jenny Herling, Gartenleitung",
    summary="Ernten, was im Garten wächst, und daraus gemeinsam kochen (Kinder 6–10 Jahre).",
    desc_from="Natur und Essen gehören zusammen", desc_to="Termin", family=True, audience=["Kinder 6–10 Jahre"], maxp=10,
    occ=[occ("2026-08-20", "11:00", "15:00")], meet="Eingangstor Finkens Garten", transit=FG_TRANSIT,
    cost=cost_free("Die Teilnahme ist kostenlos."), reg=reg(email="info@finkensgarten.org", note="Maximal zehn Kinder."),
    contact={"name": "Jenny Herling, Gartenleitung", "phone": "0173 8895185", "email": "jenny.herling@finkensgarten.org", "web": None},
    notes=FG_KID_NOTE + ["In sich abgeschlossene Veranstaltung; die Teilnahme am ersten Teil (Aussaat) ist nicht erforderlich."])

add(id="p121-fg-fuehrung-erwachsene", title="Offene Führung für Erwachsene durch den Naturerlebnisgarten", kind="Führung",
    pages=[121], venue="finkens-garten", cats=[NATUR, FUEHR], org="Finkens Garten", guide="Hauptamtliches Team, Finkens Garten",
    summary="Finkens Garten gestern, heute und morgen – ein Naturerlebnisgarten ist auch für große Kinder spannend.",
    desc_from="Wissenswertes über Finkens Garten", desc_to="Termin", audience=["Erwachsene"],
    occ=[occ("2026-09-04", "14:30", "16:00")], meet="Eingangstor Finkens Garten", transit=FG_TRANSIT,
    cost=cost_free("Die Teilnahme ist kostenlos."), reg=NOREG, contact=FG_CONTACT, notes=FG_KID_NOTE)

add(id="p136-fg-lernwerkstatt", title="Lernwerkstatt für Sechs- bis Zehnjährige", kind="Workshop",
    pages=[136], venue="finkens-garten", cats=[FAMILIE, NATUR], org="Finkens Garten",
    summary="Pflanzen, Tiere und Lebensräume mit Lupe und Mikroskop erforschen (Kinder 6–10 Jahre).",
    desc_from="Wir erforschen und entdecken", desc_to="Termine", family=True, audience=["Kinder 6–10 Jahre"], maxp=8,
    occ=[occ("2026-10-22", "10:00", "14:00")], meet="Bei den Gebäuden mitten im Garten", transit=FG_TRANSIT,
    cost=cost_free("Die Teilnahme ist kostenlos."), reg=reg(email="info@finkensgarten.org", note="Maximal acht Kinder."),
    contact=FG_CONTACT, notes=FG_KID_NOTE + ["Für mittags bitte ein Picknick mitbringen."])

add(id="p146-fg-weihnachtsbaumverkauf", title="Weihnachtsbaumverkauf des Lions Club Köln-Hanse", kind="Verkauf",
    pages=[146], venue="finkens-garten", cats=[SONST], org="Lions Club Köln-Hanse (in Finkens Garten)",
    summary="Weihnachtsbaumverkauf mit warmen Getränken und Snacks; der Erlös kommt dem Naturerlebnisgarten und den Kölner Frauenhäusern zugute.",
    occ=[occ("2026-12-12", "10:00", "17:00"), occ("2026-12-13", "10:00", "17:00")],
    meet="Eingangstor, Finkens Garten", transit=FG_TRANSIT,
    cost={"free": None, "adult": None, "reduced": None, "reducedFor": None,
          "note": "Verkauf von Weihnachtsbäumen; Preise werden im Programm nicht genannt."},
    reg=UNKREG, contact=FG_CONTACT,
    notes=["Der Erlös ist für den Verein der Freunde und Förderer des Naturerlebnisgartens und die Kölner Frauenhäuser bestimmt."])

# =====================================================================
# FREILUGA
# =====================================================================
add(id="p81-freiluga-tag-der-offenen-tuer", title="Freiluga: Tag der offenen Tür", kind="Tag der offenen Tür",
    pages=[81], probe="Tag der offenen", extra_pages=[21, 22, 23], venue="freiluga", cats=[NATUR, KULTUR], org="Freiluga (Stadt Köln / Förderverein Freiluga e. V.)",
    summary="Die Freiluft- und Gartenarbeitsschule feiert 101-jähriges Bestehen mit einem Tag der offenen Tür.",
    desc_from="Die Städtische Freiluft- und Gartenarbeitsschule", desc_to="Termin",
    occ=[occ("2026-06-13", None, None, note="Uhrzeit im Programm nicht angegeben; weitere Infos: www.freiluga-ev-koeln.de/aktuelles")],
    meet="Haupteingang Belvederestraße 159, 50933 Köln-Müngersdorf",
    transit=["Rhein-Energie-Stadion (KVB-Linie 1)", "Belvederestraße (KVB-Linie 144)"],
    cost=cost_free("Der Eintritt ist kostenlos."), reg=NOREG,
    contact={"name": "Sylvia Ohmstede", "phone": None, "email": "sylvia.ohmstede@stadt-koeln.de", "web": "https://www.freiluga-ev-koeln.de/aktuelles"})

# =====================================================================
# GUT LEIDENHAUSEN / UMWELTBILDUNGSZENTRUM
# =====================================================================
add(id="p84-langer-tag-stadtnatur", title="Langer Tag der Kölner Stadtnatur", kind="Aktionstag",
    pages=[84, 85], venue="gut-leidenhausen", cats=[NATUR, FAMILIE, TIERE], org="Gut Leidenhausen (Heideportal)",
    summary="Vortragsreihe, Podiumsdiskussion, Führungen, Infostände und Mitmachaktionen für Kinder rund um Gut Leidenhausen.",
    desc_from="Seit 2016", desc_to="Termin", family=True, audience=["Familien"],
    occ=[occ("2026-06-21", "11:00", "17:00")], meet="Umweltbildungszentrum Gut Leidenhausen, Gut Leidenhausen 1, 51147 Köln-Porz",
    transit=GL_TRANSIT, cost=cost_free("Die Teilnahme ist kostenlos."), reg=NOREG, contact=HP_CONTACT)

add(id="p115-gemuesegartenpforte", title="Tag der offenen Gemüsegartenpforte", kind="Tag der offenen Tür",
    pages=[115], venue="gut-leidenhausen", cats=[NATUR, SONST], org=GL_ORG,
    summary="Das Ehrenamts-Team stellt den ökologischen Gemüsegarten „Hirschgarten“ vor und beantwortet Fragen.",
    desc_from="Der „Hirschgarten“", desc_to="Termin",
    occ=[occ("2026-08-16", "12:00", "16:00")], meet="Hirschgarten, gegenüber Hirschgehege Gut Leidenhausen", transit=GL_TRANSIT,
    cost=cost_free("Die Teilnahme ist kostenlos."), reg=NOREG,
    contact={"name": "Team Hirschgarten", "phone": None, "email": "sdw-nrw-koeln@netcologne.de", "web": None})

add(id="p116-obst-arboretum", title="Tag der offenen Tür im Obst-Arboretum", kind="Tag der offenen Tür",
    pages=[116], venue="gut-leidenhausen", cats=[NATUR, WALD], org=GL_ORG,
    summary="Alte Obstsorten, Wildobst und Zukunftssorten: Das Ehrenamts-Team stellt die Obstwiese vor.",
    desc_from="Die Obstwiese auf Gut", desc_to="Termin",
    occ=[occ("2026-08-16", "12:00", "16:00")], meet="Greifvogelschutzstation, Gut Leidenhausen", transit=GL_TRANSIT,
    cost=cost_free("Die Teilnahme ist kostenlos."), reg=NOREG,
    contact={"name": "Team Greifvogelschutzstation", "phone": None, "email": "sdw-nrw-koeln@netcologne.de", "web": None})

add(id="p117-greifvogelstation-offene-tuer", title="Tag der offenen Tür der Greifvogelschutzstation Köln", kind="Tag der offenen Tür",
    pages=[117], extra_pages=[26], venue="gut-leidenhausen", cats=[TIERE, NATUR], org=GL_ORG,
    summary="Das Team der Greifvogelschutzstation stellt seine Arbeit mit verletzten Greifvögeln und Eulen vor.",
    desc_from="Die Greifvogelschutzstation auf Gut", desc_to="Termin",
    occ=[occ("2026-08-16", "12:00", "16:00")], meet="Greifvogelschutzstation, Gut Leidenhausen", transit=GL_TRANSIT,
    cost=cost_free("Die Teilnahme ist kostenlos."), reg=NOREG, contact=SDW_CONTACT)

add(id="p128-lebendiges-museum-kreativ", title="Lebendiges Museum: Kreativ-Workshops „Wald der Zukunft“", kind="Workshop-Reihe",
    pages=[128, 129], venue="gut-leidenhausen", cats=[KULTUR, WALD, FAMILIE], org="Gut Leidenhausen, Haus des Waldes (mit ökoRAUSCH Think tank e. V.)",
    summary="Kreative Workshops im Haus des Waldes: gestalten mit Natur- oder Upcycling-Materialien – für Erwachsene und Kinder.",
    desc_from="Im Haus des Waldes eröffnet 2027", desc_to="Termine", family=True, audience=["Erwachsene", "Kinder"],
    occ=[occ("2026-09-13", "11:00", "16:00"), occ("2026-10-11", "11:00", "16:00"),
         occ("2026-11-08", "11:00", "16:00"), occ("2026-12-13", "11:00", "16:00")],
    meet="Gut Leidenhausen, Haus des Waldes, Grengeler Mauspfad, 51147 Köln-Porz-Eil", transit=GL_TRANSIT,
    cost=cost_free("Die Teilnahme ist kostenlos."),
    reg=reg(url="https://www.sdw-nrw-koeln.de", note="Anmeldung über www.sdw-nrw-koeln.de. Details und Zielgruppen der einzelnen Termine ab Mai 2026 dort."),
    contact={"name": "Schutzgemeinschaft Deutscher Wald Köln e. V.", "phone": None, "email": None, "web": "https://www.sdw-nrw-koeln.de"})

add(id="p130-apfelfest", title="Apfelfest mit Apfelsaftpressen", kind="Fest",
    pages=[130, 131], venue="gut-leidenhausen", cats=[NATUR, SONST], org="Umweltbildungszentrum Gut Leidenhausen",
    summary="Ausstellung alter Apfelsorten, Saftpressaktion mit eigenen Früchten, Apfelkuchen, Honig und mehr.",
    desc_from="Auch in diesem Jahr", desc_to="Termin",
    occ=[occ("2026-09-13", "11:00", "17:00")], meet="Umweltbildungszentrum Gut Leidenhausen, Gut Leidenhausen 1, 51147 Köln-Porz",
    transit=GL_TRANSIT,
    cost=cost_free("Die Teilnahme ist kostenlos. Beim Saftpressen werden 20 kg Obst ohne Zuzahlung gegen 5 Liter Saft getauscht; Speisen und Saftverkauf kosten extra."),
    reg=NOREG, contact=HP_CONTACT,
    notes=["Wer 100 Kilogramm oder mehr pressen möchte, sollte sich vorab anmelden, um Wartezeiten zu vermeiden."])

add(id="p138-gutsfest-kuerbis", title="Mittelalterliches Gutsfest und Kürbisschnitzen", kind="Fest",
    pages=[138, 139], venue="gut-leidenhausen", cats=[KULTUR, FAMILIE], org="Umweltbildungszentrum Gut Leidenhausen",
    summary="Ritter, Handwerksstände, Falkner und Geschichtenerzähler – dazu Kürbisschnitzen und Stockbrot am Feuer.",
    desc_from="Auf dem ehrwürdigen", desc_to="Termin", family=True, audience=["Besucher*innen jeden Alters"],
    occ=[occ("2026-10-24", "11:00", "17:00"), occ("2026-10-25", "11:00", "17:00")],
    meet="Umweltbildungszentrum Gut Leidenhausen, Gut Leidenhausen 1, 51147 Köln-Porz", transit=GL_TRANSIT,
    cost=cost_free("Die Teilnahme ist kostenlos. Für das Kürbisschnitzen entstehen Materialkosten; Speisen und Getränke gegen Entgelt."),
    reg=NOREG, contact=HP_CONTACT)

add(id="p142-waldweihnacht", title="Waldweihnacht", kind="Fest",
    pages=[142, 143], venue="gut-leidenhausen", cats=[FAMILIE, KULTUR, SONST], org="Umweltbildungszentrum Gut Leidenhausen",
    summary="Weihnachtliches Wochenende mit Plätzchenbacken, Basteln, Schminken, Geschichten und Glühwein.",
    desc_from="Wenn sich der Duft", desc_to="Termin", family=True, audience=["Familien"],
    occ=[occ("2026-11-28", "12:00", "19:30"), occ("2026-11-29", "12:00", "19:30")],
    meet="Umweltbildungszentrum Gut Leidenhausen, Gut Leidenhausen 1, 51147 Köln-Porz", transit=GL_TRANSIT,
    cost=cost_free("Die Teilnahme ist kostenlos."), reg=NOREG, contact=HP_CONTACT)

# =====================================================================
# LINDENTHALER TIERPARK
# =====================================================================
add(id="p124-waldmesse-tierpark", title="Waldmesse im Tierpark", kind="Gottesdienst",
    pages=[124], extra_pages=[31], venue="lindenthaler-tierpark", cats=[TIERE, KULTUR, FAMILIE], org="Verein der Freunde und Förderer des Lindenthaler Tierparks e. V.",
    summary="Traditionelle Waldmesse unter freiem Himmel, anschließend Essen, Trinken und Greifvogelschau.",
    desc_from="Der Verein der Freunde und Förderer des Lindenthaler Tier", desc_to="Termin", family=True, audience=["Jung und Alt"],
    occ=[occ("2026-09-06", "11:00")], meet="Lindenthaler Tierpark",
    transit=["Brahmsstraße (KVB-Linien 7, 136)", "Kitschburger Straße (KVB-Linie 136)"],
    cost=cost_free("Die Teilnahme ist kostenlos."), reg=NOREG,
    contact={"name": "Martin Gallhöfer, Förderverein Lindenthaler Tierpark e. V.", "phone": "02233 96306-61",
             "email": "info@lindenthaler-tierpark.de", "web": None},
    notes=["Hunde dürfen den Park nicht betreten."])

add(id="p145-adventsandacht-tierpark", title="Adventsandacht mit Musik", kind="Andacht",
    pages=[145], extra_pages=[31], venue="lindenthaler-tierpark", cats=[TIERE, KULTUR], org="Verein der Freunde und Förderer des Lindenthaler Tierparks e. V.",
    summary="Besinnliche Andacht an der Lebendtier-Krippe, danach Musik und heiße Getränke.",
    desc_from="Der Verein der Freunde und Förderer des Lindenthaler", desc_to="Termin",
    occ=[occ("2026-12-06", "15:00")], meet="Lindenthaler Tierpark, Lebendtier-Krippe",
    transit=["Brahmsstraße (KVB-Linien 7, 136)", "Kitschburger Straße (KVB-Linie 136)"],
    cost=cost_free("Die Teilnahme ist kostenlos."), reg=NOREG,
    contact={"name": "Martin Gallhöfer, Förderverein Lindenthaler Tierpark e. V.", "phone": "02233 96306-61",
             "email": "info@lindenthaler-tierpark.de", "web": None},
    notes=["Hunde dürfen den Park nicht betreten."])

# =====================================================================
# FRIEDHOF
# =====================================================================
add(id="p140-ostfriedhof", title="Führung über den Ostfriedhof", kind="Führung",
    pages=[140], venue="ostfriedhof", cats=[KULTUR, FUEHR], org="Friedhöfe (Amt für Landschaftspflege und Grünflächen)",
    guide="Dieter Barbian, Gärtnermeister",
    summary="Grabarten, eisenzeitliche Hügelgräber und das Denkmal für das Zwangsarbeiterlager: Friedhöfe als mehr als ein Ort der Trauer.",
    desc_from="Die Unterschiede zwischen den Grabarten", desc_to="Termin", duration="ca. 2,5 Stunden",
    occ=[occ("2026-10-30", "13:00", "15:30", approx=True, note="Dauer laut Programm „ungefähr 2,5 Stunden“.")],
    meet="Ostfriedhof, an der Pförtnerloge, Eingang Dellbrücker Mauspfad", transit=["Ostfriedhof (KVB-Linie 154)"],
    cost=cost_free("Die Teilnahme ist kostenlos."), reg=NOREG,
    contact={"name": "Dieter Barbian, Gärtnermeister", "phone": "0221 2858735", "email": None, "web": None})

# =====================================================================
# KÖLNER STRASSENBÄUME
# =====================================================================
add(id="p83-strassenbaeume", title="Kölner Straßenbäume – So wichtig und so gestresst", kind="Spaziergang",
    pages=[83], venue=None, cats=[WALD, NATUR, FUEHR], org="Amt für Landschaftspflege und Grünflächen",
    guide="Daniel Gerhardt, Amt für Landschaftspflege und Grünflächen",
    summary="Zweistündiger Spaziergang zu den Herausforderungen für Stadtbäume und die Menschen, die sich um sie kümmern.",
    desc_from="Als bedeutendstes Element", desc_to="Termin", duration="ca. 2 Stunden", maxp=20,
    occ=[occ("2026-06-17", "14:00", "16:00", approx=True, note="Dauer laut Programm „circa zweistündig“.")],
    meet="Der Treffpunkt wird mit der Anmeldung bekannt gegeben.", transit=[],
    cost=cost_free("Die Teilnahme ist kostenlos."),
    reg=reg(email="daniel.gerhardt@stadt-koeln.de", note="Maximal 20 Personen. Der Treffpunkt wird erst nach der Anmeldung mitgeteilt."),
    contact={"name": "Daniel Gerhardt", "phone": "0221 221-34801", "email": "daniel.gerhardt@stadt-koeln.de", "web": None})

# =====================================================================
# KÖLNER FESTUNGSTAGE (Fortis Colonia)
# =====================================================================
def festung(page, slug, title, venue, guide, dates, meet, transit, summary, kind="Führung", **kw):
    add(id=f"p{page}-ft-{slug}", probe=kw.pop("probe", None), title=f"Festungstage: {title}", kind=kind, pages=[page], extra_pages=[20], venue=venue,
        cats=[KULTUR, FUEHR], org=FC_ORG, guide=guide, summary=summary, desc_from=kw.pop("desc_from", None), desc_to="Termin",
        occ=dates, meet=meet, transit=transit, cost=cost_free("Die Führungen sind kostenlos."), reg=FC_REG, contact=FC_CONTACT, **kw)

festung(88, "zwischenwerk-iiib", "Zwischenwerk IIIb", "zwischenwerk-iiib", "Mitglieder des Vereins",
        [occ("2026-07-11", "10:00", "16:00")], "Buschweg/Militärringstraße (Eingang zum Zwischenwerk IIIb)",
        ["Schumacherring (KVB-Linie 127)", "Görlinger Zentrum (KVB-Linie 3)"],
        "Tageswaldschule der 1920er Jahre im Festungswerk im Nüssenberger Busch mit Ausstellung zum Festungswesen.",
        desc_from="1923 wurde das")
festung(89, "fort-iv", "Fort IV in Bocklemünd", "fort-iv", "Uwe Zinnow", [occ("2026-07-11", "11:00")],
        "Freimersdorfer Weg, Eingang zum Fort IV", ["Bocklemünd (KVB-Linien 3, 4)"],
        "Führung zur Kehlkaserne des Fort IV und seiner wechselvollen Nutzung.", desc_from="Von dem um 1874")
festung(90, "fort-x-neusser-wall", "Fort X, Neusser Wall", "fort-x-neusser-wall", "Christoph Gilles",
        [occ("2026-07-11", "12:00"), occ("2026-07-11", "15:00")], "Vor dem Hofzugang, Neusser Wall 41",
        ["Reichensperger Platz (KVB-Linien 6, 18, 140, 184)", "Worringer Straße (KVB-Linien 140, 184)", "Lohsestraße (KVB-Linien 12, 15)"],
        "Rundgang durch eines der ältesten preußischen Forts und den „grünen Fort“ mit Rosengarten – in Montur der frühen preußischen Zeit.",
        desc_from="Das zwischen 1819")
festung(91, "kunibertsturm", "Vom Kunibertsturm zum „Thürmchen“", "kunibertsturm", "Alexander Hess", [occ("2026-07-11", "12:00")],
        "Vor dem Haus Konrad-Adenauer-Ufer 55", ["Ebertplatz (KVB-Linien 12, 15, 16, 18, 127, 140)", "Breslauer Platz (KVB-Linien 16, 18)"],
        "Mittelalterliche Befestigung am Übergang von Stadtmauer zur Rheinmauer.", desc_from="Am Übergang von der landseitigen")
festung(92, "turm-prinzengarde", "Turm der Prinzengarde", "turm-prinzengarde", "Eberhard Pingsdorf",
        [occ("2026-07-11", "14:00"), occ("2026-07-12", "12:00")], "Vor dem Turm am Sachsenring",
        ["Eifelstraße (KVB-Linien 15, 12, 16)"],
        "Einer der beiden erhaltenen mittelalterlichen Türme am Sachsenring und seine Geschichte.", desc_from="Der Turm der Prinzengarde, der")
festung(93, "fort-vi-deckstein", "Fort VI, Deckstein", "fort-vi", "Wolfgang Wegener", [occ("2026-07-11", "15:00")],
        "Vor dem Fort", ["Deckstein (KVB-Linie 146)"],
        "Das erste Fort im äußeren Festungsring, heute „grünes Fort“.", desc_from="Von dem 1873")
festung(94, "burgen-rechtsrheinisch", "Burgen im Rechtsrheinischen", "hst-dellbruecker-hauptstr", "Dr. Alexander Kierdorf",
        [occ("2026-07-11", "15:00", "18:00", approx=True, note="Beginn 15:00 Uhr (15:10 Uhr am Thurner Hof); Dauer ungefähr 3 Stunden.")],
        "KVB-Haltestelle Dellbrücker Hauptstraße (KVB-Linie 13)", ["Endpunkt: KVB-Haltestelle Herler Ring bzw. Haus Herl (KVB-Linie 18)"],
        "Fahrradtour zu Türmen und Gräben befestigter Häuser entlang der Strunde.", kind="Radtour", desc_from="Eine Fahrradtour zu Türmen",
        duration="ca. 3 Stunden")
festung(95, "zwischenwerk-va", "Zwischenwerk Va (Freiluga)", "freiluga", "Angelika Burauen", [occ("2026-07-12", "11:00")],
        "Vor dem Zugang, Belvederestraße 159", ["Belvederestraße (KVB-Linie 144)"],
        "Das Zwischenwerk Va und die dort um 1925 angelegte Freiluft- und Gartenbauschule.", desc_from="Auf dem 1875")
festung(96, "fort-x-rechtsrheinisch", "Fort X, Rechtsrheinisch", "fort-x-rechtsrheinisch", "Dr. Thomas Irlenbusch", [occ("2026-07-12", "13:00")],
        "Vor dem Fort, Zugang zwischen Frankfurter Straße und Nohlenweg", ["Sportpark Höhenberg (KVB-Linien 1, 151, 152)"],
        "Kehlkaserne, Wälle und Gräben des rechtsrheinischen Fort X.", desc_from="Das von 1877")
festung(97, "fort-i", "Fort I", "fort-i", "Dirk Wolfrum und Thomas Hilker", [occ("2026-07-12", "13:00")],
        "Vor dem Fort am Oberländer Wall", ["Ubierring (KVB-Linien 15, 16, 133, 142)", "Bonner Wall (KVB-Linien 17, 106, 132, 133)"],
        "Das 1830 als Rheinschanze errichtete Fort und seine Umgestaltung zum „grünen Fort“.", desc_from="Das 1830 als Rheinschanze")
festung(98, "roemische-rheinfront", "Römische Rheinfront", "malzmuehle", "Jean Bruno Broicher",
        [occ("2026-07-11", "14:00"), occ("2026-07-12", "14:00")], "An der Malzmühle/Mühlenbach",
        ["Heumarkt (KVB-Linien 1, 5, 7, 9, 106, 132, 133, 25, 260, 928)"],
        "Rundgang entlang der römischen Rheinfront vom Ubiermonument bis zur Römermauer in der Tiefgarage am Dom.", desc_from="Ende des ersten Jahrhunderts")
festung(100, "gruenanlagen-ringstrasse", "Grünanlagen der Stadtmauerreste an der Ringstraße", "bottmuehle", "Dr. Joachim Bauer",
        [occ("2026-07-12", "15:00")], "Bottmühle, Severinswall",
        ["Ubierring (KVB-Linien 15, 16 und 133)", "Clodwigplatz (KVB-Linien 15, 16, 17, 106, 132, 133, 142)"],
        "Fahrradtour zu den heutigen und ehemaligen Grünanlagen vor den Relikten der mittelalterlichen Stadtmauer.", kind="Radtour",
        desc_from="Fahrradtour zu den heutigen")
festung(101, "fort-x-sanierung", "Fort X, Neusser Wall – Sanierungsentwürfe", "fort-x-neusser-wall", "Martin Alexander Henessy und Philipp Marvin Molter",
        [occ("2026-07-12", "14:00", "17:00")], "Eingang Fort X",
        ["Reichensperger Platz (KVB-Linien 16, 18, 140, 184)", "Worringer Straße (KVB-Linien 140, 184)", "Lohsestraße (KVB-Linien 12, 15)"],
        "Junge Architekten stellen Entwürfe für die Sanierung und Nutzung des ältesten Forts Kölns vor.", desc_from="Für das Kernwerk", probe="Fort X, Neusser Wall")
festung(102, "gereonswall", "Stadtmauer am Gereonswall", "gereonswall", "Dr. Raimo Becker-Haumann", [occ("2026-07-12", "15:00")],
        "Am Kümpchenshof/Gereonswall", ["Hansaring (KVB-Linien 12, 15, 127)", "Christophstraße (KVB-Linien 12, 15)"],
        "Mittelalterlicher Mauerabschnitt mit Basaltmauer, Zinnen, Graben und Türmen.", desc_from="Der mittelalterliche Mauerabschnitt")
festung(103, "ulrepforte", "Ulrepforte", "ulrepforte", "Mitglieder der Roten Funken", [occ("2026-07-12", "14:00")],
        "Ulrepforte (am schlafenden Funken) am Kartäuser Wall", ["Ulrepforte (KVB-Linien 15, 16)"],
        "Das kleinste Doppelturmtor der Kölner Stadtmauer – inklusive Gang in die freigelegte Kaponniere.", desc_from="Die im Mittelalter als Stadttor")

# =====================================================================
# REGELMÄSSIGE TERMINE (Seiten 12, 19, 43) – aus Wiederholungsregeln abgeleitet
# =====================================================================
add(id="p19-forstbotanischer-garten-mittwoch", title="Führung durch den Forstbotanischen Garten (monatlich, Mittwoch)", kind="Führung",
    pages=[18, 19], probe="Forstbotanischen Garten", venue="forstbotanischer-garten", cats=[WALD, BOTANIK, FUEHR], org="Forstverwaltung der Stadt Köln",
    guide="Ralf Maiwald, Forstverwaltung",
    summary="Thematische Führung durch den Forstbotanischen Garten mit seinen seltenen Gehölzen – jeden 1. Mittwoch im Monat.",
    desc_from="Die Idee, die bereits", desc_to="Termin", derived="Jeden 1. Mittwoch im Monat um 14:30 Uhr",
    occ=[], rule={"kind": "nth_weekday", "n": [1], "weekday": 2, "months": list(range(1, 13)), "start": "14:30", "end": None},
    meet="Unterstellpilz/Brunnen im Zentrum des Forstbotanischen Gartens, Schillingsrotter Straße 100, 50996 Köln-Rodenkirchen",
    transit=["Schillingsrotter Straße (KVB-Linie 135)", "Konrad-Adenauer-Straße (KVB-Linie 131)", "Rodenkirchen Bahnhof (KVB-Linien 16, 17, 130, 135)"],
    cost=cost_free("Die Teilnahme ist kostenlos."), reg={**NOREG, "note": "Eine Anmeldung ist nur bei den Samstagsführungen erforderlich."},
    contact={"name": "Ralf Maiwald, Forstverwaltung", "phone": "0221 354325", "email": "ralf.maiwald@stadt-koeln.de", "web": None},
    notes=["Hunde sind nicht gestattet (Ausnahme: Assistenzhunde)."])

add(id="p19-forstbotanischer-garten-samstag", title="Führung durch den Forstbotanischen Garten (monatlich, Samstag)", kind="Führung",
    pages=[18, 19], probe="Forstbotanischen Garten", venue="forstbotanischer-garten", cats=[WALD, BOTANIK, FUEHR], org="Forstverwaltung der Stadt Köln",
    guide="Ralf Maiwald, Forstverwaltung",
    summary="Thematische Führung durch den Forstbotanischen Garten – jeden 3. Samstag im Monat, Anmeldung erforderlich.",
    desc_from="Die Idee, die bereits", desc_to="Termin", derived="Jeden 3. Samstag im Monat um 15 Uhr", maxp=None,
    occ=[], rule={"kind": "nth_weekday", "n": [3], "weekday": 5, "months": list(range(1, 13)), "start": "15:00", "end": None},
    meet="Unterstellpilz/Brunnen im Zentrum des Forstbotanischen Gartens, Schillingsrotter Straße 100, 50996 Köln-Rodenkirchen",
    transit=["Schillingsrotter Straße (KVB-Linie 135)", "Konrad-Adenauer-Straße (KVB-Linie 131)", "Rodenkirchen Bahnhof (KVB-Linien 16, 17, 130, 135)"],
    cost=cost_free("Die Teilnahme ist kostenlos."),
    reg=reg(email="ralf.maiwald@stadt-koeln.de", deadline="spätestens bis zum vorherigen Freitag, 10 Uhr",
            note="Die Führung findet ab einer Mindestanzahl von fünf Teilnehmenden statt."),
    contact={"name": "Ralf Maiwald, Forstverwaltung", "phone": "0221 354325", "email": "ralf.maiwald@stadt-koeln.de", "web": None},
    notes=["Hunde sind nicht gestattet (Ausnahme: Assistenzhunde)."])

add(id="p43-wildpark-duennwald", title="Führung durch den Wildpark Dünnwald (monatlich)", kind="Führung",
    pages=[43], probe="Wildpark", venue="wildpark-duennwald", cats=[TIERE, WALD, FUEHR], org="Forstverwaltung der Stadt Köln",
    guide="Simon Hausmann, Forstverwaltung",
    summary="Wie erkennt man Dam-, Schwarz- und Muffelwild und das Waldwisent? Führung jeden 2. Mittwoch im Monat.",
    desc_from="Wie erkennt man", desc_to="Termin", duration="1,5 Stunden", derived="Jeden 2. Mittwoch im Monat, 14 bis 15:30 Uhr",
    occ=[], rule={"kind": "nth_weekday", "n": [2], "weekday": 2, "months": list(range(1, 13)), "start": "14:00", "end": "15:30"},
    meet="Wegweiser am Wildpark, Dünnwalder Mauspfad 230, 51069 Köln-Dünnwald",
    transit=["Wildpark (KVB-Linie 154)", "Leuchterstraße (KVB-Linien 4, 154, 155, 157)"],
    cost=cost_free("Die Führungen sind kostenlos."), reg=UNKREG,
    contact={"name": "Simon Hausmann, Forstverwaltung", "phone": "0221 601307", "email": None, "web": None})

add(id="p12-bienenhaus-finkens-garten", title="Bienenhaus in Finkens Garten geöffnet", kind="Offenes Bienenhaus",
    pages=[12], extra_pages=[10], probe="Das Bienenhaus", venue="finkens-garten", cats=[TIERE, NATUR], org="Kölner Imker*innen (Finkens Garten)",
    summary="Kölner Imker*innen beantworten Fragen zu Bienenhaltung und Honiggewinnung; Honigverkostung und Verkauf regionaler Produkte.",
    desc_from="Das Bienenhaus ist von März", desc_to="Kontakt",
    derived="März bis November jeden 2. und 4. Sonntag im Monat sowie am 1. Advent, 11 bis 16 Uhr",
    occ=[], rule={"kind": "nth_weekday", "n": [2, 4], "weekday": 6, "months": list(range(3, 12)), "start": "11:00", "end": "16:00",
                  "extra": ["2026-11-29"]},
    meet="Bienenhaus in Finkens Garten", transit=FG_TRANSIT,
    cost={"free": None, "adult": None, "reduced": None, "reducedFor": None,
          "note": "Kosten nicht angegeben; Honigverkostung und Verkauf regionaler Produkte."},
    reg=UNKREG, contact={"name": "Kölner Imkerverein", "phone": "0175 8953399", "email": "vorstand@koelner-imkerverein.de", "web": None},
    notes=["Es gibt auch Führungen für Kindergruppen."])
