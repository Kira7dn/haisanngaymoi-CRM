/**
 * Test Instagram token and account ID
 */

const token = "IGAAKxhtSNjzhBZAGFseGZAwSXhManE2ZAl9tZADF1b1VlMlAxN0MtbUdSdmV0VnFGUlo3SnlTYXFNR3luQkdUZAF9PeUUwaG96S1FkckJrbURERG5pZAlpLREp3YWI1ZA1F4NkRBUk4wTTctekZA3NWw4UlJzVFNn";
const igAccountId = "26363331563270000";

async function testInstagramToken() {
  console.log("Testing Instagram token and account ID...\n");

  // Test 1: Verify token with Instagram Graph API /me endpoint
  console.log("1. Testing token with Instagram Graph API /me endpoint...");
  try {
    const meRes = await fetch(
      `https://graph.instagram.com/v23.0/me?access_token=${token}&fields=id,username,account_type,media_count`
    );
    const meData = await meRes.json();
    console.log("Instagram /me response:", JSON.stringify(meData, null, 2));
  } catch (error) {
    console.error("Error:", error);
  }

  // Test 2: Check IG account info using Instagram Graph API
  console.log("\n2. Testing IG account with Instagram Graph API...");
  try {
    const igRes = await fetch(
      `https://graph.instagram.com/v23.0/${igAccountId}?access_token=${token}&fields=id,username,name,profile_picture_url,account_type`
    );
    const igData = await igRes.json();
    console.log("IG Account response:", JSON.stringify(igData, null, 2));
  } catch (error) {
    console.error("Error:", error);
  }

  // Test 3: Try to create media container using Instagram Graph API
  console.log("\n3. Testing media container creation with Instagram Graph API...");
  try {
    const mediaRes = await fetch(
      `https://graph.instagram.com/v23.0/${igAccountId}/media`,
      {
        method: "POST",
        body: new URLSearchParams({
          access_token: token,
          image_url: "https://media.linkstrategy.io.vn/posts/1765640322565-2.png",
          caption: "Test post from CRM",
        }),
      }
    );
    const mediaData = await mediaRes.json();
    console.log("Media creation response:", JSON.stringify(mediaData, null, 2));
  } catch (error) {
    console.error("Error:", error);
  }
}

testInstagramToken().catch(console.error);
