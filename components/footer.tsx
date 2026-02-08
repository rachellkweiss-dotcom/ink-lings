import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-blue-50/30 border-t border-blue-200/50">
      <div className="max-w-6xl mx-auto px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="text-gray-600 text-sm">
            © 2025 Ink-lings
          </div>
          
          <div className="flex space-x-6 text-sm">
            <Link
              href="/contact"
              className="text-blue-700 hover:text-blue-800 transition-colors font-medium hover:bg-blue-50/50 px-3 py-1 rounded-md"
            >
              Contact Support
            </Link>
            <Link 
              href="/privacy-policy" 
              className="text-blue-700 hover:text-blue-800 transition-colors font-medium hover:bg-blue-50/50 px-3 py-1 rounded-md"
              target="_blank"
              rel="noopener noreferrer"
            >
              Privacy Policy
            </Link>
            <Link 
              href="/terms-of-service" 
              className="text-blue-700 hover:text-blue-800 transition-colors font-medium hover:bg-blue-50/50 px-3 py-1 rounded-md"
              target="_blank"
              rel="noopener noreferrer"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
