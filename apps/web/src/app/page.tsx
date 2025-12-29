'use client'

import { useState, useEffect } from 'react'
import { Search, Book, Heart, MessageCircle, User, Menu, X } from 'lucide-react'
import { Button } from '@bible-study/ui'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <Book className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">AI Bible Study</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/bible" className="text-gray-700 hover:text-blue-600 transition-colors">
                Read Bible
              </Link>
              <Link href="/search" className="text-gray-700 hover:text-blue-600 transition-colors">
                Search
              </Link>
              <Link href="/study" className="text-gray-700 hover:text-blue-600 transition-colors">
                Study Plans
              </Link>
              <Link href="/ai-chat" className="text-gray-700 hover:text-blue-600 transition-colors">
                AI Chat
              </Link>
            </nav>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white/95 backdrop-blur-sm">
            <nav className="px-4 py-2 space-y-1">
              <Link 
                href="/bible" 
                className="block px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Read Bible
              </Link>
              <Link 
                href="/search" 
                className="block px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Search
              </Link>
              <Link 
                href="/study" 
                className="block px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Study Plans
              </Link>
              <Link 
                href="/ai-chat" 
                className="block px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                AI Chat
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Experience Scripture Study
            <span className="text-blue-600"> Like Never Before</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Discover profound biblical insights through advanced AI technology, 
            comprehensive cross-references, and personalized study pathways 
            using the King James Version Bible.
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-12">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search verses, topics, or ask a question..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-lg"
              />
              <Button
                type="submit"
                size="lg"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 px-6"
              >
                Search
              </Button>
            </div>
          </form>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Search className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">AI-Powered Search</h3>
            <p className="text-gray-600">
              Find relevant passages using natural language queries and semantic search technology.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <MessageCircle className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">AI Insights</h3>
            <p className="text-gray-600">
              Get deep theological insights and practical applications powered by advanced AI.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Heart className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Personal Study</h3>
            <p className="text-gray-600">
              Track progress, create notes, and build personalized study pathways.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-4">
              <Book className="h-6 w-6 text-amber-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Rich Context</h3>
            <p className="text-gray-600">
              Access cross-references, Strong's concordance, and historical context.
            </p>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center bg-white rounded-xl p-8 shadow-lg">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Deepen Your Bible Study?
          </h2>
          <p className="text-lg text-gray-600 mb-6">
            Join thousands of believers who are transforming their Scripture study experience.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/bible">
              <Button size="lg" className="px-8">
                Start Reading
              </Button>
            </Link>
            <Link href="/ai-chat">
              <Button variant="outline" size="lg" className="px-8">
                Try AI Chat
              </Button>
            </Link>
          </div>
        </div>

        {/* Statistics */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-3xl font-bold text-blue-600 mb-2">31,102</div>
            <div className="text-gray-600">KJV Bible Verses</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-purple-600 mb-2">8,674</div>
            <div className="text-gray-600">Strong's Concordance</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-green-600 mb-2">100,000+</div>
            <div className="text-gray-600">Cross-References</div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Book className="h-6 w-6 text-blue-400" />
                <span className="text-lg font-semibold">AI Bible Study</span>
              </div>
              <p className="text-gray-400">
                Transform your Bible study experience with AI-powered insights and personalized learning.
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Features</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/bible" className="hover:text-white transition-colors">Bible Reader</Link></li>
                <li><Link href="/search" className="hover:text-white transition-colors">Search</Link></li>
                <li><Link href="/ai-chat" className="hover:text-white transition-colors">AI Chat</Link></li>
                <li><Link href="/study" className="hover:text-white transition-colors">Study Plans</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
                <li><Link href="/help" className="hover:text-white transition-colors">Help</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Connect</h4>
              <p className="text-gray-400 mb-4">
                Join our community of Bible study enthusiasts.
              </p>
              <Button variant="outline" className="border-gray-600 text-white hover:bg-white hover:text-gray-900">
                Get Started
              </Button>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 AI Bible Study. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}