import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");

const BASE_URL = "http://localhost:3001";

async function main() {
  console.log("=== Testing CRM Endpoints ===");

  const testEmail = `business_${Date.now()}@example.com`;
  const testPassword = "securePassword123";

  // 1. Test Registration
  console.log("1. Registering new business user:", testEmail);
  const regRes = await fetch(`${BASE_URL}/api/crm/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fullName: "Ramesh Sharma",
      email: testEmail,
      phoneNumber: "9876543210",
      password: testPassword,
    }),
  });

  const regData = await regRes.json();
  console.log("Register response:", regRes.status, regData);
  if (!regData.success) throw new Error("Registration failed");

  const cookies = regRes.headers.get("set-cookie");
  console.log("Received cookie:", cookies ? "Yes (crm_session)" : "No");

  // 2. Check Session
  console.log("2. Checking Session...");
  const sessRes = await fetch(`${BASE_URL}/api/crm/auth/session`, {
    headers: { Cookie: cookies || "" },
  });
  const sessData = await sessRes.json();
  console.log("Session response:", sessData);
  if (!sessData.authenticated) throw new Error("Session check failed");

  // 3. Test Onboarding Save
  console.log("3. Completing Onboarding (Step 1, 2, 3)...");
  const onbRes = await fetch(`${BASE_URL}/api/crm/onboarding`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookies || "",
    },
    body: JSON.stringify({
      businessName: "Sharma Electricals Ltd",
      contactName: "Ramesh Sharma",
      mobileNumber: "9876543210",
      email: testEmail,
      addressLine1: "123 Industrial Area, Phase 2",
      addressLine2: "Hyderabad, Telangana - 500037",
      dateFormat: "dd/MM/yyyy",
      currencyCode: "INR",
      currencyCountry: "India",
      currencyPriceFormatted: "₹999,999.12",
    }),
  });
  const onbData = await onbRes.json();
  console.log("Onboarding response:", onbRes.status, onbData);
  if (!onbData.success) throw new Error("Onboarding submission failed");

  // 4. Check Session again after onboarding
  console.log("4. Checking Session after onboarding...");
  const sess2Res = await fetch(`${BASE_URL}/api/crm/auth/session`, {
    headers: { Cookie: cookies || "" },
  });
  const sess2Data = await sess2Res.json();
  console.log("Updated Session:", sess2Data);
  if (!sess2Data.isOnboardingCompleted) throw new Error("Onboarding should be marked completed");
  if (sess2Data.business.businessName !== "Sharma Electricals Ltd") {
    throw new Error("Business name mismatch");
  }

  // 5. Test Login
  console.log("5. Testing Login with registered credentials...");
  const loginRes = await fetch(`${BASE_URL}/api/crm/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: testEmail,
      password: testPassword,
    }),
  });
  const loginData = await loginRes.json();
  console.log("Login response:", loginRes.status, loginData);
  if (!loginData.success || !loginData.isOnboardingCompleted) {
    throw new Error("Login failed or onboarding status incorrect");
  }

  console.log("=== All CRM E2E Tests Passed! ===");
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
