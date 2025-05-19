import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, ExternalLink } from "lucide-react";

export default function References() {
  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Academic References</h1>
        <p className="mt-1 text-sm text-gray-600">
          Research materials supporting this blockchain-based motor vehicle insurance POC
        </p>
      </div>

      {/* References section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <BookOpen className="h-5 w-5 mr-2" />
            Literature References
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-3 border-l-4 border-blue-400 bg-blue-50">
              <p className="text-sm font-medium">Neene, V., Kabemba, M., & Musonda, A. (2022)</p>
              <p className="text-sm text-gray-600">Blockchain Applications in the Insurance Industry of Developing Countries: A Case Study of Zambia</p>
              <p className="text-xs text-gray-500 mt-1">Journal of African Business Technology, 15(3), 234-250</p>
            </div>
            
            <div className="p-3 border-l-4 border-blue-400 bg-blue-50">
              <p className="text-sm font-medium">Kshetri, N. (2023)</p>
              <p className="text-sm text-gray-600">Blockchain and smart contract implementation in insurance: Global trends and implications for emerging markets</p>
              <p className="text-xs text-gray-500 mt-1">Journal of Global Information Technology Management, 26(1), 58-77</p>
            </div>
            
            <div className="p-3 border-l-4 border-blue-400 bg-blue-50">
              <p className="text-sm font-medium">Road Transport and Safety Agency (RTSA) (2022)</p>
              <p className="text-sm text-gray-600">Annual Report on Road Traffic Accidents in Zambia</p>
              <p className="text-xs text-gray-500 mt-1">Government of Zambia, Lusaka</p>
            </div>
            
            <div className="p-3 border-l-4 border-blue-400 bg-blue-50">
              <p className="text-sm font-medium">Zambia Information and Communications Technology Authority (ZICTA) (2021)</p>
              <p className="text-sm text-gray-600">Digital Technologies Adoption in Financial Services Sector</p>
              <p className="text-xs text-gray-500 mt-1">ICT Survey Report, Lusaka, Zambia</p>
            </div>
            
            <div className="p-3 border-l-4 border-blue-400 bg-blue-50">
              <p className="text-sm font-medium">Moonde, L. (2023)</p>
              <p className="text-sm text-gray-600">Digital Transformation of Insurance Services in Sub-Saharan Africa: Challenges and Opportunities</p>
              <p className="text-xs text-gray-500 mt-1">African Journal of Information Systems, 15(2), 112-130</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Project context */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Project Context</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-600 space-y-4">
            <p>
              The evolution of digital technologies continues to reshape traditional industries, and the insurance 
              sector is no exception. Blockchain and smart contracts have emerged as transformative tools in automating 
              and streamlining core operations such as claims processing and billing. Globally, the motor vehicle 
              insurance industry faces major challenges in fraud detection, transparency, and delays in claim settlements. 
              Blockchain, with its decentralized and immutable ledger, offers a promising solution to address these 
              inefficiencies (Neene et al., 2022). Smart contracts, self-executing contracts with predefined rules 
              encoded on the blockchain, can further enhance automation, eliminating intermediaries and human error 
              (Kshetri, 2023).
            </p>
            
            <p>
              In Africa, particularly in Zambia, digital adoption in insurance services remains relatively low, but the 
              need for robust, corruption-resistant, and efficient systems is high (Moonde, 2023). Lusaka, being Zambia's 
              most populous urban center, presents a compelling case for piloting such digital transformations. According 
              to the Road Transport and Safety Agency (RTSA), Zambia recorded over 31,000 road traffic accidents in 2022 
              alone, with Lusaka accounting for 36% of these (RTSA, 2022). Yet, less than 45% of motor vehicle owners in 
              Lusaka have comprehensive insurance, largely due to distrust in claim handling and poor billing transparency 
              (Neene et al., 2022). With only 8.1% of insurance companies in Zambia experimenting with blockchain or 
              related automation (ZICTA, 2021), there's a clear technology gap waiting to be explored.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Technology concepts */}
      <Card>
        <CardHeader>
          <CardTitle>Key Blockchain Concepts Applied</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-md font-semibold mb-2">Immutable Ledger</h3>
              <p className="text-sm text-gray-600">
                Once data is recorded in a block and added to the chain, it cannot be altered. This ensures 
                that insurance records, claims, and policies maintain their integrity and cannot be tampered with.
              </p>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-md font-semibold mb-2">Distributed Consensus</h3>
              <p className="text-sm text-gray-600">
                Multiple nodes (insurance companies, RTSA, auditors) validate and agree on the state of the blockchain, 
                eliminating the need for a central authority and building trust among participants.
              </p>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-md font-semibold mb-2">Smart Contracts</h3>
              <p className="text-sm text-gray-600">
                Self-executing code that automatically processes claims based on predefined rules, reducing manual 
                verification and accelerating the claims settlement process.
              </p>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-md font-semibold mb-2">Cryptographic Verification</h3>
              <p className="text-sm text-gray-600">
                Each transaction and block is cryptographically secured using hashing algorithms, ensuring data 
                integrity and creating a chain of trust from the genesis block.
              </p>
            </div>
          </div>
          
          <div className="mt-6">
            <h3 className="text-md font-semibold mb-3">External Resources</h3>
            <ul className="space-y-2">
              <li className="flex items-center">
                <ExternalLink className="h-4 w-4 mr-2 text-blue-500" />
                <a 
                  href="https://www.investopedia.com/terms/b/blockchain.asp" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-sm"
                >
                  Investopedia: Blockchain Explained
                </a>
              </li>
              <li className="flex items-center">
                <ExternalLink className="h-4 w-4 mr-2 text-blue-500" />
                <a 
                  href="https://www.mckinsey.com/industries/financial-services/our-insights/blockchain-in-insurance-opportunity-or-threat" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-sm"
                >
                  McKinsey: Blockchain in Insurance
                </a>
              </li>
              <li className="flex items-center">
                <ExternalLink className="h-4 w-4 mr-2 text-blue-500" />
                <a 
                  href="https://www.ibm.com/topics/smart-contracts" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-sm"
                >
                  IBM: Smart Contracts Defined
                </a>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
