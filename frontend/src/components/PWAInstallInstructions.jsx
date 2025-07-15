import { Smartphone, Monitor, Globe, Share2, Plus } from 'lucide-react';

const PWAInstallInstructions = () => {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);
  const isChrome = /Chrome/.test(navigator.userAgent);
  const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);

  const getInstructions = () => {
    if (isIOS) {
      return {
        title: "Install on iPhone/iPad",
        steps: [
          "Tap the Share button (square with arrow pointing up)",
          "Scroll down and tap 'Add to Home Screen'",
          "Tap 'Add' to confirm"
        ],
        icon: <Smartphone className="w-6 h-6" />
      };
    } else if (isAndroid) {
      return {
        title: "Install on Android",
        steps: [
          "Tap the menu button (three dots) in your browser",
          "Tap 'Add to Home screen' or 'Install app'",
          "Tap 'Add' or 'Install' to confirm"
        ],
        icon: <Smartphone className="w-6 h-6" />
      };
    } else if (isChrome) {
      return {
        title: "Install on Chrome Desktop",
        steps: [
          "Click the install icon in the address bar (looks like a computer with a plus)",
          "Or click the menu button (three dots) and select 'Install Deacon'",
          "Click 'Install' to confirm"
        ],
        icon: <Monitor className="w-6 h-6" />
      };
    } else {
      return {
        title: "Install on Desktop",
        steps: [
          "Look for an install button in your browser's address bar",
          "Or use the browser menu to find 'Add to Home Screen'",
          "Follow your browser's installation prompts"
        ],
        icon: <Globe className="w-6 h-6" />
      };
    }
  };

  const instructions = getInstructions();

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-lg flex items-center justify-center">
          {instructions.icon}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Install Deacon App</h3>
          <p className="text-sm text-gray-600">{instructions.title}</p>
        </div>
      </div>

      <div className="space-y-3">
        {instructions.steps.map((step, index) => (
          <div key={index} className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 mt-0.5">
              {index + 1}
            </div>
            <p className="text-sm text-gray-700">{step}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Share2 className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-900">Why install?</span>
        </div>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• Faster access to your church tools</li>
          <li>• Works offline for basic functions</li>
          <li>• App-like experience</li>
          <li>• Automatic updates</li>
        </ul>
      </div>
    </div>
  );
};

export default PWAInstallInstructions;