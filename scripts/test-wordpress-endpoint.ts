/**
 * Test WordPress endpoint - posts vs posts/new
 */

const siteId = "245226340";
const accessToken = "(mSoJ^Z%ESrBE^fvm6H^m5HQLczcolBWZPCB2LwGT%ny5lBMYF)BxRpQa7v!Ou(a";

async function testEndpoints() {
  console.log("Testing WordPress.com API endpoints...\n");

  // Test POST to /posts (WRONG)
  console.log("1. Testing POST /posts (expected to fail)...");
  try {
    const res1 = await fetch(
      `https://public-api.wordpress.com/rest/v1.1/sites/${siteId}/posts`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: "Test Wrong Endpoint",
          content: "Testing wrong endpoint",
          status: "draft",
        }),
      }
    );

    const data1 = await res1.json();
    console.log("Status:", res1.status, res1.statusText);
    console.log("Response:", JSON.stringify(data1, null, 2));
  } catch (error) {
    console.error("Error:", error);
  }

  console.log("\n2. Testing POST /posts/new (correct)...");
  try {
    const res2 = await fetch(
      `https://public-api.wordpress.com/rest/v1.1/sites/${siteId}/posts/new`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: "Test Correct Endpoint",
          content: "Testing correct endpoint",
          status: "draft",
        }),
      }
    );

    const data2 = await res2.json();
    console.log("Status:", res2.status, res2.statusText);
    console.log("Response:", JSON.stringify(data2, null, 2));

    // Delete the test post if created
    if (data2.ID) {
      console.log("\nDeleting test post...");
      await fetch(
        `https://public-api.wordpress.com/rest/v1.1/sites/${siteId}/posts/${data2.ID}/delete`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      console.log("Test post deleted");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

testEndpoints().catch(console.error);
