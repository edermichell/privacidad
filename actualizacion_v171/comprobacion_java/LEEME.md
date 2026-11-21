# Comprobación del código Java sin Android Studio
`MainActivity.java` se compiló con `javac` contra:
- el framework real de **Android 16 (API 36)**: `org.robolectric:android-all:16-robolectric-13921718` (Maven Central),
- **Unity Ads 4.16.1** real (`com.unity3d.ads:unity-ads:4.16.1`, Maven Central),
- y las clases de `stub/` para Play Billing 8, UMP 3 e In-App Updates (copias de sus firmas: el repositorio de Google no era accesible).

Resultado: **0 errores**. Orden usado:
`javac -proc:none --release 17 -cp android-all.jar:unity-ads-classes.jar -d out $(find stub -name "*.java") MainActivity.java`
