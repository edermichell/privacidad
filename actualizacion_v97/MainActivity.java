package com.impulso.ultimorefugio;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.content.Context;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.os.VibratorManager;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import com.android.billingclient.api.AcknowledgePurchaseParams;
import com.android.billingclient.api.BillingClient;
import com.android.billingclient.api.BillingClientStateListener;
import com.android.billingclient.api.BillingFlowParams;
import com.android.billingclient.api.BillingResult;
import com.android.billingclient.api.ConsumeParams;
import com.android.billingclient.api.PendingPurchasesParams;
import com.android.billingclient.api.ProductDetails;
import com.android.billingclient.api.Purchase;
import com.android.billingclient.api.QueryProductDetailsParams;
import com.android.billingclient.api.QueryPurchasesParams;
import com.google.android.gms.ads.AdError;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.FullScreenContentCallback;
import com.google.android.gms.ads.LoadAdError;
import com.google.android.gms.ads.MobileAds;
import com.google.android.gms.ads.RequestConfiguration;
import com.google.android.gms.ads.interstitial.InterstitialAd;
import com.google.android.gms.ads.interstitial.InterstitialAdLoadCallback;
import com.google.android.gms.ads.rewarded.RewardedAd;
import com.google.android.gms.ads.rewarded.RewardedAdLoadCallback;
import com.google.android.ump.ConsentInformation;
import com.google.android.ump.ConsentRequestParameters;
import com.google.android.ump.UserMessagingPlatform;

import com.unity3d.ads.IUnityAdsInitializationListener;
import com.unity3d.ads.IUnityAdsLoadListener;
import com.unity3d.ads.IUnityAdsShowListener;
import com.unity3d.ads.UnityAds;
import com.unity3d.ads.UnityAdsShowOptions;
import com.unity3d.ads.metadata.MetaData;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Envoltorio: abre assets/index.html (el juego completo) en un WebView a pantalla completa.
 * Las partidas se guardan con localStorage, que se conserva entre sesiones.
 *
 * Además expone al juego el puente JavaScript "AndroidMonet" con:
 *   - Anuncios con recompensa e intersticiales: Unity Ads (por defecto), AdMob o ninguno (v83, string ads_provider),
 *     con formulario de consentimiento UMP.
 *   - Compras dentro de la app con Google Play Billing.
 * El juego (05c_shop.js) llama a AndroidMonet.* y recibe el resultado en window.__monet(id, ok, extra).
 */
public class MainActivity extends Activity {

    // Productos (deben existir con estos mismos ID en Play Console > Monetización > Productos integrados)
    private static final String SKU_NOADS = "noads";      // no consumible
    private static final String SKU_SKINS = "skins";      // no consumible
    private static final String SKU_VIP = "vip";          // no consumible
    private static final String SKU_CRATES5 = "crates5";  // consumible (5 cajas)
    private static final List<String> ALL_SKUS = Arrays.asList(SKU_NOADS, SKU_SKINS, SKU_VIP, SKU_CRATES5);

    private WebView web;

    // ---- anuncios
    private RewardedAd rewarded;
    private InterstitialAd interstitial;
    private boolean loadingRewarded, loadingInter;
    private final AtomicBoolean adsStarted = new AtomicBoolean(false);
    private ConsentInformation consent;
    private boolean consentBusy;            // v97: hay una consulta de consentimiento en curso
    private long consentAt;

    // ---- Unity Ads (v83)
    private final Handler ui = new Handler(Looper.getMainLooper());
    private boolean unityInitializing, unityRewardedReady, unityInterReady, unityLoadingRew, unityLoadingInter;
    private int unityRewFails, unityInterFails;

    // ---- compras
    private BillingClient billing;
    private boolean billingReady;
    private final Map<String, ProductDetails> details = new HashMap<>();
    private int buyReq = 0;
    private String buySku = null;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        if (Build.VERSION.SDK_INT >= 33) {
            getOnBackInvokedDispatcher().registerOnBackInvokedCallback(
                    android.window.OnBackInvokedDispatcher.PRIORITY_DEFAULT, () -> handleBack());
        }

        web = new WebView(this);
        web.setBackgroundColor(Color.BLACK);
        web.setOverScrollMode(View.OVER_SCROLL_NEVER);
        web.setVerticalScrollBarEnabled(false);
        web.setHorizontalScrollBarEnabled(false);
        web.setLongClickable(false);
        web.setOnLongClickListener(v -> true);
        web.setHapticFeedbackEnabled(false);
        web.setLayerType(View.LAYER_TYPE_HARDWARE, null); // v51: el lienzo del juego se compone por GPU
        setContentView(web);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);                 // localStorage (partidas, récords, opciones)
        s.setMediaPlaybackRequiresUserGesture(false); // audio del juego
        s.setAllowFileAccess(true);
        s.setAllowFileAccessFromFileURLs(false);
        s.setAllowUniversalAccessFromFileURLs(false);
        s.setSupportZoom(false);
        s.setBuiltInZoomControls(false);
        s.setCacheMode(WebSettings.LOAD_DEFAULT);

        web.addJavascriptInterface(new Bridge(), "AndroidMonet"); // solo se carga contenido propio (assets)
        web.setWebViewClient(new WebViewClient());
        web.setWebChromeClient(new WebChromeClient());
        web.loadUrl("file:///android_asset/index.html");
        hideSystemUi();

        startConsentAndAds();
        startBilling();
    }

    /* ======================= puente JS ======================= */
    private class Bridge {
        @JavascriptInterface
        public void showRewarded(int req) { runOnUiThread(() -> doShowRewarded(req)); }

        @JavascriptInterface
        public void showInterstitial(int req) { runOnUiThread(() -> doShowInterstitial(req)); }

        @JavascriptInterface
        public void buy(String sku, int req) { runOnUiThread(() -> doBuy(sku, req)); }

        @JavascriptInterface
        public void restore(int req) { runOnUiThread(() -> { queryOwned(true); js("window.__monet(" + req + ",true,'')"); }); }

        @JavascriptInterface
        public void sync() { runOnUiThread(() -> { queryOwned(false); pushState(); }); }

        @JavascriptInterface
        public void privacy() { runOnUiThread(MainActivity.this::openPrivacy); }

        /** Vibración corta (v63). */
        @JavascriptInterface
        public void vibrate(int ms) { doVibrate(ms); }

        /** Cajas compradas aún sin acreditar en el juego (se guardan en el teléfono hasta que el juego confirma). */
        @JavascriptInterface
        public int peekCredits() { return prefs().getInt("pend_crates", 0); }

        @JavascriptInterface
        public void ackCredits(int n) {
            synchronized (credLock) {
                SharedPreferences p = prefs();
                p.edit().putInt("pend_crates", Math.max(0, p.getInt("pend_crates", 0) - Math.max(0, n))).commit();
            }
        }
    }

    private final Object credLock = new Object();
    private SharedPreferences prefs() { return getSharedPreferences("monet", Context.MODE_PRIVATE); }

    private Vibrator vib;
    @SuppressWarnings("deprecation")
    private void doVibrate(int ms) {
        try {
            if (ms < 5) ms = 5; if (ms > 400) ms = 400;
            if (vib == null) {
                if (Build.VERSION.SDK_INT >= 31) {
                    VibratorManager vm = (VibratorManager) getSystemService(Context.VIBRATOR_MANAGER_SERVICE);
                    if (vm != null) vib = vm.getDefaultVibrator();
                } else vib = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
            }
            if (vib == null || !vib.hasVibrator()) return;
            if (Build.VERSION.SDK_INT >= 26) vib.vibrate(VibrationEffect.createOneShot(ms, VibrationEffect.DEFAULT_AMPLITUDE));
            else vib.vibrate(ms);
        } catch (Exception ignored) { }
    }

    /** Verifica la firma de Google Play de una compra. Si no se configuró play_license_key se acepta (solo Play Billing local). */
    private boolean purchaseOk(Purchase p) {
        String key = getString(R.string.play_license_key).trim();
        if (key.isEmpty()) return true;
        try {
            byte[] kb = android.util.Base64.decode(key, android.util.Base64.DEFAULT);
            java.security.PublicKey pk = java.security.KeyFactory.getInstance("RSA")
                    .generatePublic(new java.security.spec.X509EncodedKeySpec(kb));
            java.security.Signature sg = java.security.Signature.getInstance("SHA1withRSA");
            sg.initVerify(pk);
            sg.update(p.getOriginalJson().getBytes("UTF-8"));
            return sg.verify(android.util.Base64.decode(p.getSignature(), android.util.Base64.DEFAULT));
        } catch (Exception e) { return false; }
    }

    private void js(String code) {
        if (web != null) web.evaluateJavascript(code, null);
    }

    /* ======================= consentimiento + AdMob ======================= */
    private String provider() {
        String p = getString(R.string.ads_provider).trim().toLowerCase();
        return ("admob".equals(p) || "none".equals(p)) ? p : "unity";
    }
    private boolean useUnity() { return "unity".equals(provider()); }
    private boolean useAdmob() { return "admob".equals(provider()); }

    private void startConsentAndAds() {
        if ("none".equals(provider())) return; // variante sin anuncios: no se pide consentimiento ni se inicia ningún SDK de anuncios
        consent = UserMessagingPlatform.getConsentInformation(this);
        requestConsent();
        initAdsIfAllowed(); // si ya había consentimiento de una sesión anterior
    }

    /** v97: pide (o reintenta) el estado del consentimiento. Antes solo se pedía una vez al abrir la app: si en ese momento no había red,
     *  el estado quedaba «desconocido» y NO había anuncios hasta reiniciar la app. Ahora se reintenta al volver a la app (onResume). */
    private void requestConsent() {
        if (consent == null) return;
        if (consentBusy && android.os.SystemClock.elapsedRealtime() - consentAt < 60000L) return;
        consentBusy = true; consentAt = android.os.SystemClock.elapsedRealtime();
        ConsentRequestParameters params = new ConsentRequestParameters.Builder().build();
        consent.requestConsentInfoUpdate(this, params,
                () -> UserMessagingPlatform.loadAndShowConsentFormIfRequired(this, err -> { consentBusy = false; initAdsIfAllowed(); }),
                err -> { consentBusy = false; initAdsIfAllowed(); });
    }

    private static final List<String> EEA_UK_CH = Arrays.asList("AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT",
            "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE", "IS", "LI", "NO", "GB", "CH");

    /** v97: si no se pudo averiguar el estado del consentimiento (sin red o configuración incompleta) y NI el idioma NI la red/SIM del teléfono
     *  indican EEE, Reino Unido o Suiza, se permite iniciar Unity igualmente (fuera de esas regiones no se exige el formulario). En la duda, no se inician anuncios. */
    private boolean regionFree() {
        if (consent == null || consent.getConsentStatus() != ConsentInformation.ConsentStatus.UNKNOWN) return false;
        try {
            String loc = java.util.Locale.getDefault().getCountry();
            if (loc == null || loc.isEmpty() || EEA_UK_CH.contains(loc.toUpperCase(java.util.Locale.ROOT))) return false;
            android.telephony.TelephonyManager tm = (android.telephony.TelephonyManager) getSystemService(Context.TELEPHONY_SERVICE);
            if (tm != null) {
                String sim = tm.getSimCountryIso(), net = tm.getNetworkCountryIso();
                if (sim != null && EEA_UK_CH.contains(sim.toUpperCase(java.util.Locale.ROOT))) return false;
                if (net != null && EEA_UK_CH.contains(net.toUpperCase(java.util.Locale.ROOT))) return false;
            }
            return true;
        } catch (Throwable t) { return false; }
    }

    private boolean adsAllowed() { return consent != null && (consent.canRequestAds() || regionFree()); }

    private void initAdsIfAllowed() {
        if (!adsAllowed()) return;
        if (useUnity()) { initUnity(); return; }
        if (!useAdmob() || !adsStarted.compareAndSet(false, true)) return;
        // Juego con violencia de zombis: contenido para adolescentes y mayores (no dirigido a menores de 13)
        MobileAds.setRequestConfiguration(new RequestConfiguration.Builder()
                .setMaxAdContentRating(RequestConfiguration.MAX_AD_CONTENT_RATING_T)
                .setTagForChildDirectedTreatment(RequestConfiguration.TAG_FOR_CHILD_DIRECTED_TREATMENT_FALSE)
                .setTagForUnderAgeOfConsent(RequestConfiguration.TAG_FOR_UNDER_AGE_OF_CONSENT_FALSE)
                .build());
        MobileAds.initialize(this, status -> {
            loadRewarded();
            loadInterstitial();
        });
    }

    private void loadRewarded() {
        if (rewarded != null || loadingRewarded || !adsStarted.get()) return;
        loadingRewarded = true;
        RewardedAd.load(this, getString(R.string.admob_rewarded), new AdRequest.Builder().build(), new RewardedAdLoadCallback() {
            @Override public void onAdLoaded(RewardedAd ad) { rewarded = ad; loadingRewarded = false; }
            @Override public void onAdFailedToLoad(LoadAdError e) { rewarded = null; loadingRewarded = false; }
        });
    }

    private void loadInterstitial() {
        if (interstitial != null || loadingInter || !adsStarted.get()) return;
        loadingInter = true;
        InterstitialAd.load(this, getString(R.string.admob_interstitial), new AdRequest.Builder().build(), new InterstitialAdLoadCallback() {
            @Override public void onAdLoaded(InterstitialAd ad) { interstitial = ad; loadingInter = false; }
            @Override public void onAdFailedToLoad(LoadAdError e) { interstitial = null; loadingInter = false; }
        });
    }

    private void doShowRewarded(int req) {
        if (!useAdmob()) {
            if (useUnity()) unityShowRewarded(req); else js("window.__monet(" + req + ",false,'nofill')");
            return;
        }
        final RewardedAd ad = rewarded;
        if (ad == null) {
            loadRewarded();
            js("window.__monet(" + req + ",false,'nofill')");
            return;
        }
        rewarded = null;
        final boolean[] earned = {false};
        ad.setFullScreenContentCallback(new FullScreenContentCallback() {
            @Override public void onAdDismissedFullScreenContent() {
                js("window.__monet(" + req + "," + earned[0] + ",'" + (earned[0] ? "" : "skipped") + "')");
                loadRewarded();
            }
            @Override public void onAdFailedToShowFullScreenContent(AdError e) {
                js("window.__monet(" + req + ",false,'nofill')");
                loadRewarded();
            }
        });
        ad.show(this, item -> earned[0] = true);
    }

    private void doShowInterstitial(int req) {
        if (!useAdmob()) {
            if (useUnity()) unityShowInterstitial(req); else js("window.__monet(" + req + ",true,'nofill')");
            return;
        }
        final InterstitialAd ad = interstitial;
        if (ad == null) {
            loadInterstitial();
            js("window.__monet(" + req + ",true,'nofill')"); // sin anuncio listo: el juego continúa sin castigar al jugador
            return;
        }
        interstitial = null;
        ad.setFullScreenContentCallback(new FullScreenContentCallback() {
            @Override public void onAdDismissedFullScreenContent() { js("window.__monet(" + req + ",true,'')"); loadInterstitial(); }
            @Override public void onAdFailedToShowFullScreenContent(AdError e) { js("window.__monet(" + req + ",true,'')"); loadInterstitial(); }
        });
        ad.show(this);
    }

    /* ======================= Unity Ads (v83) ======================= */
    private void initUnity() {
        if (!useUnity() || unityInitializing) return;
        if (UnityAds.isInitialized()) { loadUnityRewarded(); loadUnityInterstitial(); return; }
        unityInitializing = true;
        try {
            // El consentimiento recogido con UMP se le pasa a Unity (solo si el usuario lo dio).
            MetaData md = new MetaData(this);
            if (consent != null && consent.getConsentStatus() == ConsentInformation.ConsentStatus.OBTAINED) {
                md.set("gdpr.consent", true);
                md.set("privacy.consent", true);
            }
            md.commit();
        } catch (Throwable ignored) { }
        boolean test = !"false".equals(getString(R.string.unity_test_mode).trim().toLowerCase());
        try {
            UnityAds.initialize(getApplicationContext(), getString(R.string.unity_game_id).trim(), test, new IUnityAdsInitializationListener() {
                @Override public void onInitializationComplete() {
                    ui.post(() -> { unityInitializing = false; loadUnityRewarded(); loadUnityInterstitial(); });
                }
                @Override public void onInitializationFailed(UnityAds.UnityAdsInitializationError error, String message) {
                    ui.post(() -> unityInitializing = false); // el juego sigue sin anuncios; se reintenta al volver a la app
                }
            });
        } catch (Throwable t) { unityInitializing = false; }
    }

    private void loadUnityRewarded() {
        if (!useUnity() || unityRewardedReady || unityLoadingRew || !UnityAds.isInitialized()) return;
        unityLoadingRew = true;
        try {
            UnityAds.load(getString(R.string.unity_rewarded).trim(), new IUnityAdsLoadListener() {
                @Override public void onUnityAdsAdLoaded(String placementId) {
                    ui.post(() -> { unityRewardedReady = true; unityLoadingRew = false; unityRewFails = 0; });
                }
                @Override public void onUnityAdsFailedToLoad(String placementId, UnityAds.UnityAdsLoadError error, String message) {
                    ui.post(() -> {
                        unityRewardedReady = false; unityLoadingRew = false;
                        if (++unityRewFails <= 5) ui.postDelayed(MainActivity.this::loadUnityRewarded, 30000L);
                    });
                }
            });
        } catch (Throwable t) { unityLoadingRew = false; }
    }

    private void loadUnityInterstitial() {
        if (!useUnity() || unityInterReady || unityLoadingInter || !UnityAds.isInitialized()) return;
        unityLoadingInter = true;
        try {
            UnityAds.load(getString(R.string.unity_interstitial).trim(), new IUnityAdsLoadListener() {
                @Override public void onUnityAdsAdLoaded(String placementId) {
                    ui.post(() -> { unityInterReady = true; unityLoadingInter = false; unityInterFails = 0; });
                }
                @Override public void onUnityAdsFailedToLoad(String placementId, UnityAds.UnityAdsLoadError error, String message) {
                    ui.post(() -> {
                        unityInterReady = false; unityLoadingInter = false;
                        if (++unityInterFails <= 5) ui.postDelayed(MainActivity.this::loadUnityInterstitial, 30000L);
                    });
                }
            });
        } catch (Throwable t) { unityLoadingInter = false; }
    }

    private void unityShowRewarded(int req) { unityShowRewarded(req, 0); }

    /** v97: si el anuncio aún se está cargando (p. ej. justo al abrir la app), espera hasta ~4 s antes de decir «no hay anuncios». */
    private void unityShowRewarded(final int req, final int waited) {
        if (!unityRewardedReady) {
            if ((unityLoadingRew || unityInitializing) && waited < 12) { ui.postDelayed(() -> unityShowRewarded(req, waited + 1), 350L); return; }
            unityRewFails = 0; loadUnityRewarded(); initUnity();
            js("window.__monet(" + req + ",false,'nofill')");
            return;
        }
        unityRewardedReady = false;
        try {
            UnityAds.show(this, getString(R.string.unity_rewarded).trim(), new UnityAdsShowOptions(), new IUnityAdsShowListener() {
                @Override public void onUnityAdsShowFailure(String placementId, UnityAds.UnityAdsShowError error, String message) {
                    ui.post(() -> { js("window.__monet(" + req + ",false,'nofill')"); unityRewFails = 0; loadUnityRewarded(); });
                }
                @Override public void onUnityAdsShowStart(String placementId) { }
                @Override public void onUnityAdsShowClick(String placementId) { }
                @Override public void onUnityAdsShowComplete(String placementId, UnityAds.UnityAdsShowCompletionState state) {
                    final boolean ok = state == UnityAds.UnityAdsShowCompletionState.COMPLETED;
                    ui.post(() -> { js("window.__monet(" + req + "," + ok + ",'" + (ok ? "" : "skipped") + "')"); unityRewFails = 0; loadUnityRewarded(); });
                }
            });
        } catch (Throwable t) {
            js("window.__monet(" + req + ",false,'nofill')");
        }
    }

    private void unityShowInterstitial(int req) {
        if (!unityInterReady) {
            unityInterFails = 0; loadUnityInterstitial(); initUnity();
            js("window.__monet(" + req + ",true,'nofill')"); // sin anuncio listo: el juego continúa sin castigar al jugador
            return;
        }
        unityInterReady = false;
        try {
            UnityAds.show(this, getString(R.string.unity_interstitial).trim(), new UnityAdsShowOptions(), new IUnityAdsShowListener() {
                @Override public void onUnityAdsShowFailure(String placementId, UnityAds.UnityAdsShowError error, String message) {
                    ui.post(() -> { js("window.__monet(" + req + ",true,'')"); unityInterFails = 0; loadUnityInterstitial(); });
                }
                @Override public void onUnityAdsShowStart(String placementId) { }
                @Override public void onUnityAdsShowClick(String placementId) { }
                @Override public void onUnityAdsShowComplete(String placementId, UnityAds.UnityAdsShowCompletionState state) {
                    ui.post(() -> { js("window.__monet(" + req + ",true,'')"); unityInterFails = 0; loadUnityInterstitial(); });
                }
            });
        } catch (Throwable t) {
            js("window.__monet(" + req + ",true,'')");
        }
    }

    private void openPrivacy() {
        if (consent != null && consent.getPrivacyOptionsRequirementStatus()
                == ConsentInformation.PrivacyOptionsRequirementStatus.REQUIRED) {
            UserMessagingPlatform.showPrivacyOptionsForm(this, err -> initAdsIfAllowed());
        } else {
            try {
                startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(getString(R.string.privacy_url))));
            } catch (Exception ignored) { }
        }
    }

    /* ======================= Google Play Billing ======================= */
    private void startBilling() {
        billing = BillingClient.newBuilder(this)
                .setListener((result, purchases) -> {
                    if (result.getResponseCode() == BillingClient.BillingResponseCode.OK && purchases != null) {
                        for (Purchase p : purchases) handlePurchase(p, true);
                    } else {
                        finishBuy(false, result.getResponseCode() == BillingClient.BillingResponseCode.USER_CANCELED ? "cancel" : "error");
                    }
                })
                .enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().build())
                .build();
        connectBilling();
    }

    private void connectBilling() {
        if (billing == null || billing.isReady()) return;
        billing.startConnection(new BillingClientStateListener() {
            @Override public void onBillingSetupFinished(BillingResult r) {
                billingReady = r.getResponseCode() == BillingClient.BillingResponseCode.OK;
                if (billingReady) { queryDetails(); queryOwned(false); }
            }
            @Override public void onBillingServiceDisconnected() { billingReady = false; }
        });
    }

    private void queryDetails() {
        List<QueryProductDetailsParams.Product> ps = new ArrayList<>();
        for (String id : ALL_SKUS) {
            ps.add(QueryProductDetailsParams.Product.newBuilder().setProductId(id).setProductType(BillingClient.ProductType.INAPP).build());
        }
        billing.queryProductDetailsAsync(QueryProductDetailsParams.newBuilder().setProductList(ps).build(), (result, qr) -> {
            if (result.getResponseCode() != BillingClient.BillingResponseCode.OK || qr == null || qr.getProductDetailsList() == null) return;
            for (ProductDetails pd : qr.getProductDetailsList()) details.put(pd.getProductId(), pd);
            runOnUiThread(this::pushState);
        });
    }

    private final java.util.Set<String> owned = new java.util.HashSet<>();

    /** Lee las compras del usuario: reconoce las nuevas, consume las cajas pendientes y actualiza el estado del juego. */
    private void queryOwned(boolean fromRestore) {
        if (billing == null || !billing.isReady()) { connectBilling(); return; }
        billing.queryPurchasesAsync(QueryPurchasesParams.newBuilder().setProductType(BillingClient.ProductType.INAPP).build(), (result, list) -> {
            if (result.getResponseCode() != BillingClient.BillingResponseCode.OK || list == null) return;
            owned.clear();
            for (Purchase p : list) handlePurchase(p, false);
            runOnUiThread(this::pushState);
        });
    }

    private void handlePurchase(Purchase p, boolean fresh) {
        if (p.getPurchaseState() == Purchase.PurchaseState.PENDING) { if (fresh) finishBuy(false, "pending"); return; }
        if (p.getPurchaseState() != Purchase.PurchaseState.PURCHASED) return;
        if (!purchaseOk(p)) { if (fresh) finishBuy(false, "error"); return; }
        for (String sku : p.getProducts()) {
            if (SKU_CRATES5.equals(sku)) {
                // v63: primero se guarda el crédito (una sola vez por compra, por token) y luego se consume;
                // así las cajas no se pierden aunque la app se cierre a mitad del proceso.
                final String tok = p.getPurchaseToken();
                synchronized (credLock) {
                    SharedPreferences pr = prefs();
                    java.util.Set<String> done = new java.util.HashSet<>(pr.getStringSet("ctok", new java.util.HashSet<>()));
                    if (done.add(tok)) {
                        pr.edit().putStringSet("ctok", done).putInt("pend_crates", pr.getInt("pend_crates", 0) + 5).commit();
                    }
                }
                js("window.__monetPull && window.__monetPull()");
                billing.consumeAsync(ConsumeParams.newBuilder().setPurchaseToken(tok).build(), (r, token) -> { /* si falla se reintenta en la próxima consulta, sin volver a acreditar */ });
                if (fresh && buySku != null && buySku.equals(sku)) runOnUiThread(() -> finishBuy(true, "credited"));
            } else {
                owned.add(sku);
                if (!p.isAcknowledged()) {
                    billing.acknowledgePurchase(AcknowledgePurchaseParams.newBuilder().setPurchaseToken(p.getPurchaseToken()).build(), r -> { });
                }
                if (fresh) runOnUiThread(() -> { if (buySku != null && buySku.equals(sku)) finishBuy(true, ""); pushState(); });
            }
        }
    }

    private void doBuy(String sku, int req) {
        if (buySku != null) { js("window.__monet(" + req + ",false,'busy')"); return; }
        ProductDetails pd = details.get(sku);
        if (!billingReady || pd == null) {
            connectBilling();
            js("window.__monet(" + req + ",false,'unavailable')");
            return;
        }
        buyReq = req; buySku = sku;
        BillingFlowParams fp = BillingFlowParams.newBuilder()
                .setProductDetailsParamsList(java.util.Collections.singletonList(
                        BillingFlowParams.ProductDetailsParams.newBuilder().setProductDetails(pd).build()))
                .build();
        BillingResult r = billing.launchBillingFlow(this, fp);
        if (r.getResponseCode() != BillingClient.BillingResponseCode.OK) finishBuy(false, "error");
    }

    private void finishBuy(boolean ok, String why) {
        if (buySku == null) return;
        int req = buyReq; buySku = null; buyReq = 0;
        js("window.__monet(" + req + "," + ok + ",'" + why + "')");
    }

    /** Envía al juego los productos que tiene el usuario y los precios reales (moneda local). */
    private void pushState() {
        try {
            JSONObject o = new JSONObject();
            JSONArray a = new JSONArray();
            for (String s : owned) a.put(s);
            JSONObject pr = new JSONObject();
            for (Map.Entry<String, ProductDetails> e : details.entrySet()) {
                ProductDetails.OneTimePurchaseOfferDetails d = e.getValue().getOneTimePurchaseOfferDetails();
                if (d != null) pr.put(e.getKey(), d.getFormattedPrice());
            }
            o.put("owned", a);
            o.put("prices", pr);
            // solo se sobrescribe lo comprado cuando ya hay conexión con Play (para no borrar compras sin red)
            if (!billingReady) o.remove("owned");
            js("window.__monetState && window.__monetState(" + JSONObject.quote(o.toString()) + ")");
            js("window.__monetPull && window.__monetPull()");
        } catch (Exception ignored) { }
    }

    /* ======================= ciclo de vida ======================= */
    private void hideSystemUi() {
        Window w = getWindow();
        View d = w.getDecorView();
        d.setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                        | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                        | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                        | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                        | View.SYSTEM_UI_FLAG_FULLSCREEN
                        | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY);
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) hideSystemUi();
    }

    @Override
    protected void onPause() {
        // el juego guarda la partida con "pagehide"
        if (web != null) {
            web.evaluateJavascript("window.dispatchEvent(new Event('pagehide'))", null);
            web.onPause();
        }
        super.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (web != null) web.onResume();
        hideSystemUi();
        if (billing != null && billing.isReady()) queryOwned(false); // por si la compra se completó fuera de la app
        if (consent != null && consent.getConsentStatus() == ConsentInformation.ConsentStatus.UNKNOWN) requestConsent(); // v97: reintenta si falló al abrir
        if (useUnity() && adsAllowed()) {
            if (!UnityAds.isInitialized()) initUnity();
            else { unityRewFails = 0; unityInterFails = 0; loadUnityRewarded(); loadUnityInterstitial(); }
        }
    }

    /* Atrás: cierra tienda/anuncio si están abiertos; si se está jugando, pausa; en pausa o en el menú, cierra la app.
       v85: con targetSdk 36 Android ya no llama a onBackPressed() (el «atrás predictivo» no se puede desactivar), así que el gesto se
       registra con OnBackInvokedCallback (API 33+); onBackPressed() queda para Android 7–12. */
    private void handleBack() {
        if (web != null) {
            web.evaluateJavascript(
                    "(function(){var sh=document.getElementById('shop');"
                            + "if(sh&&!sh.hidden){sh.querySelector('[data-sh=close]').click();return 1;}"
                            + "var pz=document.getElementById('pause');"
                            + "if(document.body.classList.contains('ingame')&&pz&&pz.hidden){document.getElementById('bPause').click();return 1;}"
                            + "return 0;})()",
                    value -> {
                        if (!"1".equals(value)) finish();
                    });
        } else {
            finish();
        }
    }

    @Override
    @SuppressWarnings("deprecation")
    public void onBackPressed() {
        handleBack();
    }

    @Override
    protected void onDestroy() {
        ui.removeCallbacksAndMessages(null);
        if (billing != null) { billing.endConnection(); billing = null; }
        if (web != null) {
            web.destroy();
            web = null;
        }
        super.onDestroy();
    }
}
