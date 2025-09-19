import { Loader2 } from "lucide-react"

export function SplashScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 
                    bg-primary text-white sm:bg-background sm:text-foreground">
      <div className="flex flex-col items-center space-y-8">
        {/* App Logo */}
        <div className="w-24 h-24 bg-white sm:bg-primary rounded-2xl flex items-center justify-center">
          <div className="w-12 h-12 bg-primary sm:bg-white rounded-lg flex items-center justify-center">
            <div className="w-6 h-6 bg-white sm:bg-primary rounded-sm"></div>
          </div>
        </div>

        {/* App Name */}
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">FocusFlow</h1>
          <p className="text-lg opacity-80">Productivity Made Simple</p>
        </div>

        {/* Loading Spinner */}
        <div className="flex items-center space-x-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="opacity-70">Loading...</span>
        </div>
      </div>
    </div>
  )
}
