package com.google.android.ump; public interface ConsentInformation {
 void requestConsentInfoUpdate(android.app.Activity a, ConsentRequestParameters p, OnConsentInfoUpdateSuccessListener s, OnConsentInfoUpdateFailureListener f);
 int getConsentStatus(); boolean canRequestAds(); PrivacyOptionsRequirementStatus getPrivacyOptionsRequirementStatus(); void reset(); boolean isConsentFormAvailable();
 interface OnConsentInfoUpdateSuccessListener { void onConsentInfoUpdateSuccess(); } interface OnConsentInfoUpdateFailureListener { void onConsentInfoUpdateFailure(FormError e); }
 @interface ConsentStatus { int UNKNOWN = 0; int NOT_REQUIRED = 1; int REQUIRED = 2; int OBTAINED = 3; }
 enum PrivacyOptionsRequirementStatus { UNKNOWN, NOT_REQUIRED, REQUIRED } }
