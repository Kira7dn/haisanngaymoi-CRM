/**
 * Test script to verify WordPress API connection
 */

const siteId = "245226340";
const accessToken = "(mSoJ^Z%ESrBE^fvm6H^m5HQLczcolBWZPCB2LwGT%ny5lBMYF)BxRpQa7v!Ou(a";

async function testWordPressAPI() {
  console.log("Testing WordPress.com API...\n");

  // Test 1: Verify site exists
  console.log("1. Checking site info...");
  try {
    const siteRes = await fetch(
      `https://public-api.wordpress.com/rest/v1.1/sites/${siteId}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    const siteData = await siteRes.json();
    console.log("Site response status:", siteRes.status);
    console.log("Site data:", JSON.stringify(siteData, null, 2));
  } catch (error) {
    console.error("Site check error:", error);
  }

  console.log("\n2. Checking posts endpoint...");
  try {
    const postsRes = await fetch(
      `https://public-api.wordpress.com/rest/v1.1/sites/${siteId}/posts`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    const postsData = await postsRes.json();
    console.log("Posts response status:", postsRes.status);
    console.log("Posts data:", JSON.stringify(postsData, null, 2));
  } catch (error) {
    console.error("Posts check error:", error);
  }

  console.log("\n3. Testing POST to create post...");
  try {
    const createRes = await fetch(
      `https://public-api.wordpress.com/rest/v1.1/sites/${siteId}/posts/new`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: "Test Post from CRM",
          content: "This is a test post from the CRM system",
          status: "publish",
        }),
      }
    );

    const createData = await createRes.json();
    console.log("Create response status:", createRes.status);
    console.log("Create data:", JSON.stringify(createData, null, 2));
  } catch (error) {
    console.error("Create post error:", error);
  }
}

testWordPressAPI().catch(console.error);
