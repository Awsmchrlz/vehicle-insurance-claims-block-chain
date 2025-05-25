import fs from "fs";
import path from "path";
import FabricCAServices from "fabric-ca-client";
import { Wallets } from "fabric-network";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const enrollAppUser = async () => {
const ccpPath = path.resolve(__dirname, "connection.json");
const ccp = JSON.parse(fs.readFileSync(ccpPath, "utf8"));

const caURL = ccp.certificateAuthorities["ca.org1.example.com"].url;
const ca = new FabricCAServices(caURL);

const walletPath = path.join(__dirname, "wallet");
const wallet = await Wallets.newFileSystemWallet(walletPath);

const userExists = await wallet.get("appUser");
if (userExists) {
    console.log("✅ appUser already exists in the wallet");
    return;
  }

  const adminIdentity = await wallet.get("admin");
  if (!adminIdentity) {
    throw new Error("❌ Admin identity not found. Run enrollAdmin.ts first.");
  }

  const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
  const adminUser = await provider.getUserContext(adminIdentity, "admin");

  const secret = await ca.register(
    {
      affiliation: "org1.department1",
      enrollmentID: "appUser",
      role: "client",
    },
    adminUser
  );

  const enrollment = await ca.enroll({
    enrollmentID: "appUser",
    enrollmentSecret: secret,
  });

  const x509Identity = {
    credentials: {
      certificate: enrollment.certificate,
      privateKey: enrollment.key.toBytes(),
    },
    mspId: "Org1MSP",
    type: "X.509",
  };

  await wallet.put("appUser", x509Identity);
  console.log("✅ Successfully enrolled appUser and imported it into the wallet");
};

export {enrollAppUser};