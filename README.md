# SudoQMaestro
A bold and intelligent Sudoku app powered by AI. Solve or generate puzzles with ease using advanced image processing and custom algorithms. Built with Angular, Express.js, and MongoDB, it's the ultimate tool for both enthusiasts and casual players to master Sudoku.

## Alkalmazáskoncepció és magas szintű funkcionális specifikáció
Van egy alkalmazásötletem, amely két fő funkcióra épülne. Az első funkció képfeltöltés vagy mobilkamera használatával valós időben megoldana egy Sudoku rejtvényt, az eredményt pedig rávetítené a képre, lehetővé téve a felhasználónak, hogy a megoldást elmentse vagy megjelenítse. A második funkció Sudoku rejtvények készítésére szolgálna, különböző nehézségi szinteken. Ezen kívül a program lehetőséget biztosítana a létrehozott és korábban elmentett rejtvények lejátszására, valamint beépített helyességvizsgálati és javítási funkciókat kínálna a rejtvények készítése során. A fejlesztéshez egy webalkalmazásban gondolkodom, amelyhez az Angular, JavaScript, Java és Express.js alapú technológiai stack-et használnám, amelyekhez értek.

## Megvalósítási terv a SudoQMaestro apphoz

### 1. **Funkcióterv**

#### 1.1. **Sodoku Felismerés és Megoldás**

-   **Fájl feltöltése/kamerás bemenet:**
    
    -   A felhasználó feltölthet egy képet a sodoku rejtvényről, vagy kamerán keresztül rögzítheti azt.
    -   A feltöltés vagy kamerás bemenet után a rendszer automatikusan elindítja a képjavítást.
-   **Automatikus képjavítás és előkészítés:**
    
    -   **Kontraszt növelése:** Az OpenCV-vel a kép kontrasztját automatikusan növeljük, hogy a sodoku rács és a számok jobban láthatóak legyenek.
    -   **Zajszűrés:** A képen található zajokat automatikusan eltávolítjuk, hogy az OCR motor pontosabban felismerje a kézzel írt számokat.
    -   **Élek detektálása:** Az élek automatikus felismerése az OpenCV-vel, amely segít a sodoku rács azonosításában.
-   **Kézzel írt sodoku felismerése és digitalizálása:**
    
    -   **OCR feldolgozás:** A Tesseract.js motor felismeri a kézzel írt számokat a javított képen.
    -   **Rejtvény megoldása:** Az OCR eredmények alapján a sodoku rejtvényt egy algoritmus oldja meg (pl. backtracking).
-   **Megoldás megjelenítése és letöltése:**
    
    -   **Papírra vetítés:** Az eredeti képre rávetítjük a megoldott sodoku rácsot.
    -   **Webes felületen való megjelenítés:** Egy tiszta, interaktív webes felületen jelenítjük meg a megoldást.
    -   **Letöltési lehetőségek:** A megoldást PDF vagy kép formátumban lehet letölteni.

#### 1.2. **Sodoku Készítés és Ellenőrzés**

-   **Rejtvény generálása:**
    
    -   Véletlenszerű sodoku rejtvény generálása különböző nehézségi szinteken (könnyű, közepes, nehéz).
-   **Rejtvény mentése és betöltése:**
    
    -   A felhasználó által generált vagy megoldott rejtvények mentése egy adatbázisba (MongoDB).
    -   Korábban mentett rejtvények betöltése és újra megoldása.

    ##### API Végpontok

    -   `POST /api/puzzles`: Elment egy új rejtvényt a bejelentkezett felhasználóhoz. A request body-nak tartalmaznia kell a `puzzleGrid`, `solutionGrid` és `difficulty` mezőket.
    -   `GET /api/puzzles`: Visszaadja a bejelentkezett felhasználó által mentett összes rejtvény listáját.
-   **Helyességellenőrzés:**
    
    -   A felhasználó által megadott számok valós idejű ellenőrzése, hibák vizuális jelzésével.
-   **Rejtvény lejátszása:**
    
    -   A felhasználó újrajátszhatja a korábban mentett rejtvényeket, és megoldhatja őket interaktív webes felületen.

#### 1.3. **Adminisztrációs Felület**

-   **Felhasználók kezelése:**
    
    -   **Felhasználók létrehozása, szerkesztése és törlése:** Az adminisztrátor képes új felhasználókat létrehozni, szerkeszteni vagy törölni.
    -   **Felhasználói jogosultságok kezelése:** Az adminisztrátor különböző szerepköröket oszthat ki (pl. adminisztrátor, normál felhasználó).
    -   **Felhasználói aktivitás nyomon követése:** Az adminisztrátorok megtekinthetik a felhasználók aktivitását, például a bejelentkezések számát és a megoldott rejtvényeket.

    ##### API Végpontok

    -   `GET /api/admin/users`: Visszaadja az összes felhasználó listáját.
    -   `PUT /api/admin/users/:id`: Módosítja egy felhasználó adatait. Jelenleg a `role` mező módosítására van lehetőség (`{ "role": "admin" }` vagy `{ "role": "user" }`).
    -   `DELETE /api/admin/users/:id`: Töröl egy felhasználót az adatbázisból.
    -   `GET /api/admin/puzzles`: Visszaadja az összes mentett rejtvény listáját, a felhasználói adatokkal együtt.
    -   `DELETE /api/admin/puzzles/:id`: Töröl egy rejtvényt az adatbázisból az azonosítója alapján.
-   **Mentett rejtvények kezelése:**
    
    -   **Rejtvények megtekintése, szerkesztése és törlése:** Az adminisztrátorok megtekinthetik, szerkeszthetik vagy törölhetik a felhasználók által mentett rejtvényeket.
    -   **Rejtvények hozzárendelése felhasználókhoz:** Az adminisztrátorok konkrét rejtvényeket rendelhetnek felhasználókhoz.

#### 1.4. **OAuth2 Autentikáció**

-   **Bejelentkezés és regisztráció:**
    -   **OAuth2 alapú autentikáció:** Az alkalmazás támogatja a külső identitásszolgáltatók (pl. Google, Facebook) használatát az OAuth2 protokollon keresztül.
    -   **Token alapú azonosítás:** Az OAuth2 által generált hozzáférési tokenek segítségével a felhasználói munkamenetek biztonságosan kezelhetők.

----------

### 2. **UI/UX Tervezés**

#### 2.1. **Főoldal**

-   **Egyszerű navigáció:** Intuitív menü és gombok, amelyek segítségével a felhasználó elérheti a sodoku felismerést, készítést és lejátszást.
-   **Reszponzív design:** Mobilra és asztali gépre optimalizált felhasználói felület.

#### 2.2. **Fájl feltöltése és kamerás bemenet**

-   **Interaktív felület:** Felhasználóbarát felület a fájlok feltöltéséhez vagy kamerás rögzítéshez.
-   **Feldolgozási állapot kijelzése:** Jól látható visszajelzés a kép feldolgozásának állapotáról.

#### 2.3. **Megoldás megjelenítése és letöltése**

-   **Tiszta és jól olvasható felület:** Az interaktív sodoku rács megjelenítése könnyen olvasható számokkal.
-   **Letöltési opciók:** A felhasználó választhat PDF vagy kép formátum között a megoldás letöltéséhez.

#### 2.4. **Sodoku készítés és lejátszás**

-   **Interaktív rács:** A felhasználó könnyen beírhatja a számokat az interaktív rácsba, valós idejű helyességellenőrzéssel.
-   **Felhasználói visszajelzés:** Hibás számok esetén a felület vizuális visszajelzést ad.

#### 2.5. **Adminisztrációs Felület**

-   **Felhasználók listája:** Könnyen áttekinthető felhasználói lista az adminisztrátorok számára.
-   **Rejtvények listája:** Az adminisztrátor áttekintheti az összes mentett rejtvényt és kezelheti azokat.
-   **Navigáció:** Könnyen kezelhető adminisztrátori navigációs menü.

#### 2.6. **OAuth2 Bejelentkezési Felület**

-   **Egyszerű bejelentkezés:** A felhasználók egyszerűen bejelentkezhetnek külső identitásszolgáltatók segítségével.
-   **Biztonságos regisztráció:** Az új felhasználók biztonságosan regisztrálhatnak az OAuth2 protokoll használatával.

----------

### 3. **Prototípus Készítése**

#### 3.1. **Frontend**

-   **Angular alkalmazás:** A főoldal és az egyes funkciók (felismerés, készítés, lejátszás, admin felület) kialakítása Angular keretrendszerrel.
-   **Interaktív rács komponens:** Egy egyszerű rács komponens létrehozása, amely később bővíthető helyességellenőrzéssel és letöltési lehetőségekkel.

#### 3.2. **Backend**

-   **Express.js API:** Az API fejlesztése, amely kezeli a fájlokat, feldolgozza a képeket (OCR, képjavítás), megoldja a sodoku rejtvényeket, és kezeli az adminisztrációs funkciókat.
-   **MongoDB adatbázis:** Az adatbázis kialakítása a felhasználók, rejtvények és adminisztrátori műveletek kezelésére.

#### 3.3. **Képfeldolgozás és sodoku felismerés**

-   **OpenCV és Tesseract.js integráció:** A képjavító funkciók és az OCR integrálása és tesztelése.

#### 3.4. **OAuth2 Autentikáció Integrálása**

-   **OAuth2 bejelentkezési mechanizmus:** Az OAuth2 alapú autentikációs rendszer integrálása az Express.js backend-be.
-   **Token alapú hitelesítés:** A hozzáférési tokenek kezelése és a védett API végpontok megvalósítása.

----------

### 4. **Iterációk**

#### 4.1. **Első Iteráció: Alapfunkciók és Képjavítás**

-   **Sodoku felismerés és képjavítás:** A fájl feltöltés, képjavítás (kontraszt növelése, zajszűrés, élek detektálása), és OCR működésének tesztelése.
-   **Adminisztrációs felület alapjai:** Felhasználók és rejtvények alapvető kezelése az adminisztrációs felületen.
-   **OAuth2 autentikáció integrálása:** A bejelentkezési és regisztrációs folyamat tesztelése.

#### 4.2. **Második Iteráció: Fejlett Funkciók és Adminisztráció**

-   **Interaktív megoldás megjelenítése:** A megoldott sodoku rejtvény interaktív, reszponzív webes felületen való megjelenítése.
-   **Felhasználói jogosultságok kezelése:** Különböző szerepkörök és hozzáférési szintek implementálása.
-   **Rejtvények felhasználókhoz rendelése:** Rejtvények hozzárendelése konkrét felhasználókhoz az admin felületen.

#### 4.3. **Harmadik Iteráció: Biztonsági és Teljesítmény Optimalizálás**

-   **Token érvényesség és védelem:** Az OAuth2 tokenek érvényességi idejének kezelése és biztonsági finomítások.
-   **Felhasználói élmény fejlesztése:** Adminisztrációs felület és bejelentkezési folyamat optimalizálása a felhasználói visszajelzések alapján.

----------

### 5. **Technikai Részletek**

#### 5.1. **Automatikus Képjavítás**

-   **OpenCV előfeldolgozás:** Az OpenCV-vel automatizáljuk a kép előfeldolgozását, beleértve a kontraszt növelését, zajszűrést és élek detektálását.

#### 5.2. **OCR Integráció**

-   **Tesseract.js:** A Tesseract.js motor integrálása az OCR feladatokhoz, amely képes kezelni a kézzel írt számokat és szövegeket a javított képeken.

#### 5.3. **Interaktív Rács és Letöltési Funkciók**

-   **Angular alapú rács:** Dinamikus Angular komponens fejlesztése a sodoku rács megjelenítéséhez és kezeléséhez.
-   **jsPDF és HTML-to-image:** Az interaktív rács exportálása PDF és kép formátumban a letöltési funkcióhoz.

#### 5.4. **Adminisztrációs Felület**

-   **Angular Dashboard:** Egy Angular alapú adminisztrátori felület fejlesztése, amely reszponzív és jól strukturált kezelőfelületet biztosít.
-   **API Integráció:** Az Angular frontend kapcsolatba lép az Express.js backenddel a felhasználók és rejtvények kezelésére.

#### 5.5. **OAuth2 Autentikáció**

-   **Passport.js és OAuth2:** A Passport.js használatával könnyedén integrálható az OAuth2 autentikáció az Express.js backendbe.
-   **JWT Tokenek:** JSON Web Tokenek (JWT) használata a hozzáférési tokenek kezelésére és a felhasználói munkamenetek biztonságos kezelésére.

#### 5.6. **Backend és Adatbázis Kiterjesztése**

-   **Express.js API végpontok:** API végpontok a felhasználók, rejtvények és adminisztrátori műveletek kezelésére.
-   **MongoDB Sémák:** A felhasználók, rejtvények és adminisztrátori műveletek kezelésére külön sémákat hozunk létre a MongoDB-ben.

----------

### Összegzés

Ez a részletes megvalósítási terv átfogóan bemutatja az alkalmazás összes funkcióját, az adminisztrációs felületet, az OAuth2 alapú autentikációt, valamint a technikai részleteket, amelyek a sikeres fejlesztéshez szükségesek. A terv alapján az alkalmazás teljes mértékben képes lesz a sodoku rejtvények felismerésére, megoldására, generálására és a felhasználók kezelésére egy biztonságos és felhasználóbarát környezetben.

---

## Adminisztrátori Eszközök

### Admin Jogosultság Adása

A projekt tartalmaz egy parancssori szkriptet, amellyel egy felhasználónak adminisztrátori jogosultságot lehet adni. Ehhez a felhasználónak már léteznie kell az adatbázisban (azaz legalább egyszer be kell jelentkeznie az alkalmazásba).

**Használat:**

A `backend` könyvtárból futtassa a következő parancsot, a `<user-email>` helyére a felhasználó email címét beírva:

```bash
node scripts/assign-admin.js <user-email>
```

Ez a szkript megkeresi a felhasználót az email címe alapján, és a `role` mezőjét `'admin'`-ra állítja.
