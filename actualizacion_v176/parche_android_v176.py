# v17.6 · parte Android: bibliotecas al día y sin APIs obsoletas de pantalla completa (edge-to-edge)
import sys
A=sys.argv[1]   # carpeta UltimoRefugio_Android
def edit(path, pairs):
    s=open(path,encoding='utf8').read()
    for a,b in pairs:
        assert s.count(a)==1,(path,s.count(a),a[:80]); s=s.replace(a,b)
    open(path,'w',encoding='utf8').write(s)
G=A+'/app/build.gradle'
edit(G,[("user-messaging-platform:3.0.0","user-messaging-platform:4.0.0"),("unity-ads:4.16.1","unity-ads:4.22.0"),
        ("play-services-ads-identifier:18.1.0","play-services-ads-identifier:18.3.0"),("billing:8.0.0","billing:9.1.0")])
M=A+'/app/src/main/java/com/impulso/ultimorefugio/MainActivity.java'
edit(M,[
 ("import android.view.Window;\n","import android.view.Window;\nimport android.view.WindowInsets;\nimport android.view.WindowInsetsController;\n"),
 ("        s.setAllowFileAccessFromFileURLs(false);\n        s.setAllowUniversalAccessFromFileURLs(false);\n",
  "        // v17.6: setAllowFileAccessFromFileURLs/UniversalAccess ya valen false por defecto (y están obsoletas): no se llaman.\n"),
 ("        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);\n",
  "        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);\n"
  "        // v17.6: zona de la cámara (notch). Antes iba en el tema con «shortEdges», obsoleto desde Android 15.\n"
  "        // Android 11+: ALWAYS (el juego ya respeta los bordes con safe-area); Android 9-10: valor 1 (bordes cortos).\n"
  "        if (Build.VERSION.SDK_INT >= 28) {\n"
  "            WindowManager.LayoutParams clp = getWindow().getAttributes();\n"
  "            clp.layoutInDisplayCutoutMode = Build.VERSION.SDK_INT >= 30 ? WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_ALWAYS : 1;\n"
  "            getWindow().setAttributes(clp);\n"
  "        }\n"),
 ("            Display display = getWindowManager().getDefaultDisplay();\n","            Display display = currentDisplay();\n"),
 ("            float actual = getWindowManager().getDefaultDisplay().getRefreshRate();\n","            float actual = currentDisplay().getRefreshRate();\n"),
 ("""    private void hideSystemUi() {
        Window w = getWindow();
        View d = w.getDecorView();
        d.setSystemUiVisibility(""",
  """    /** v17.6: pantalla actual con la API moderna en Android 11+; la antigua solo donde no hay otra. */
    private Display currentDisplay() {
        if (Build.VERSION.SDK_INT >= 30) { Display d = getDisplay(); if (d != null) return d; }
        return legacyDisplay();
    }
    @SuppressWarnings("deprecation")
    private Display legacyDisplay() { return getWindowManager().getDefaultDisplay(); }

    /** v17.6: pantalla completa inmersiva con WindowInsetsController (Android 11+); las banderas antiguas solo en Android 7-10. */
    private void hideSystemUi() {
        Window w = getWindow();
        if (Build.VERSION.SDK_INT >= 30) {
            if (Build.VERSION.SDK_INT < 35) decorFitsLegacy(w);   /* Android 15+ ya dibuja de borde a borde por sí solo */
            WindowInsetsController c = w.getInsetsController();
            if (c != null) {
                c.hide(WindowInsets.Type.statusBars() | WindowInsets.Type.navigationBars());
                c.setSystemBarsBehavior(WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
            }
            return;
        }
        hideSystemUiLegacy(w);
    }
    @SuppressWarnings("deprecation")
    private void decorFitsLegacy(Window w) { w.setDecorFitsSystemWindows(false); }
    @SuppressWarnings("deprecation")
    private void hideSystemUiLegacy(Window w) {
        View d = w.getDecorView();
        d.setSystemUiVisibility("""),
])
for st in [A+'/app/src/main/res/values/styles.xml', A+'/app/src/main/res/values-v28/styles.xml']:
    s=open(st,encoding='utf8').read()
    for line in ['        <item name="android:statusBarColor">@android:color/black</item>\n','        <item name="android:navigationBarColor">@android:color/black</item>\n','        <item name="android:windowLayoutInDisplayCutoutMode">shortEdges</item>\n']:
        s=s.replace(line,'')
    assert 'statusBarColor' not in s and 'navigationBarColor' not in s and 'shortEdges' not in s
    open(st,'w',encoding='utf8').write(s)
print('android ok')
