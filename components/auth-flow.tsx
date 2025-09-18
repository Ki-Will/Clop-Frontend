"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Eye, EyeOff, Mail, Lock, User, Phone, MapPin } from "lucide-react"

interface AuthFlowProps {
  onComplete: () => void
}

type AuthScreen = "login" | "signup" | "profile" | "forgot-password" | "verify-code" | "reset-password"

export function AuthFlow({ onComplete }: AuthFlowProps) {
  const [currentScreen, setCurrentScreen] = useState<AuthScreen>("login")
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    username: "",
    phone: "",
    address: "",
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSocialLogin = (provider: string) => {
    // Simulate social login
    setTimeout(() => {
      onComplete()
    }, 1000)
  }

  const handleLogin = () => {
    // Simulate login
    setTimeout(() => {
      onComplete()
    }, 1000)
  }

  const handleSignup = () => {
    setCurrentScreen("profile")
  }

  const handleProfileComplete = () => {
    onComplete()
  }

  const renderLoginScreen = () => (
    <Card className="w-full max-w-sm mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
        <p className="text-muted-foreground">Sign in to your account</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Social Login Buttons */}
        <div className="space-y-3">
          <Button variant="outline" className="w-full h-12 bg-transparent" onClick={() => handleSocialLogin("google")}>
            <div className="w-5 h-5 bg-primary rounded mr-2"></div>
            Continue with Google
          </Button>
          <Button variant="outline" className="w-full h-12 bg-transparent" onClick={() => handleSocialLogin("apple")}>
            <div className="w-5 h-5 bg-foreground rounded mr-2"></div>
            Continue with Apple
          </Button>
          <Button
            variant="outline"
            className="w-full h-12 bg-transparent"
            onClick={() => handleSocialLogin("facebook")}
          >
            <div className="w-5 h-5 bg-blue-600 rounded mr-2"></div>
            Continue with Facebook
          </Button>
        </div>

        <div className="flex items-center space-x-4">
          <Separator className="flex-1" />
          <span className="text-muted-foreground text-sm">or</span>
          <Separator className="flex-1" />
        </div>

        {/* Email/Password Form */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                className="pl-10"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                className="pl-10 pr-10"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-muted-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button
            onClick={() => setCurrentScreen("forgot-password")}
            variant="link"
            className="p-0 h-auto text-primary"
          >
            Forgot password?
          </Button>

          <Button onClick={handleLogin} className="w-full h-12">
            Sign In
          </Button>
        </div>

        <div className="text-center">
          <span className="text-muted-foreground">Don't have an account? </span>
          <Button onClick={() => setCurrentScreen("signup")} variant="link" className="p-0 h-auto text-primary">
            Sign up
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  const renderSignupScreen = () => (
    <Card className="w-full max-w-sm mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
        <p className="text-muted-foreground">Join FocusFlow today</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="signup-username">Username</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                id="signup-username"
                placeholder="Choose a username"
                className="pl-10"
                value={formData.username}
                onChange={(e) => handleInputChange("username", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="signup-email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                id="signup-email"
                type="email"
                placeholder="Enter your email"
                className="pl-10"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="signup-password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                id="signup-password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a password"
                className="pl-10 pr-10"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-muted-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button onClick={handleSignup} className="w-full h-12">
            Create Account
          </Button>
        </div>

        <div className="text-center">
          <span className="text-muted-foreground">Already have an account? </span>
          <Button onClick={() => setCurrentScreen("login")} variant="link" className="p-0 h-auto text-primary">
            Sign in
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  const renderProfileScreen = () => (
    <Card className="w-full max-w-sm mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Complete Profile</CardTitle>
        <p className="text-muted-foreground">Tell us more about yourself</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Profile Photo */}
        <div className="flex flex-col items-center space-y-4">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center">
            <User className="w-10 h-10 text-muted-foreground" />
          </div>
          <Button variant="outline" size="sm">
            Upload Photo
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="profile-phone">Phone Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                id="profile-phone"
                placeholder="Enter your phone number"
                className="pl-10"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-address">Address</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                id="profile-address"
                placeholder="Enter your address"
                className="pl-10"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
              />
            </div>
          </div>

          <Button onClick={handleProfileComplete} className="w-full h-12">
            Complete Setup
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="flex flex-col min-h-screen bg-background px-6 py-8 justify-center">
      {currentScreen === "login" && renderLoginScreen()}
      {currentScreen === "signup" && renderSignupScreen()}
      {currentScreen === "profile" && renderProfileScreen()}
    </div>
  )
}
