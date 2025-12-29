'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, Bot, User, Loader2 } from 'lucide-react'
import { Button } from '@bible-study/ui'
import { Input } from '@bible-study/ui'
import { cn } from '@bible-study/utils'

interface Message {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
  contextVerses?: Array<{
    id: number
    reference: string
    text: string
  }>
  suggestedQuestions?: string[]
  processingTime?: number
}

export default function AIChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessionActive, setSessionActive] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // Start study session
    startStudySession()
    
    return () => {
      // End session on unmount
      if (sessionActive) {
        endStudySession()
      }
    }
  }, [])

  const startStudySession = async () => {
    try {
      const response = await fetch('/api/user/study-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('supabase_token')}`,
        },
        body: JSON.stringify({
          started_at: new Date().toISOString(),
          ai_queries: 0,
        }),
      })
      
      if (response.ok) {
        setSessionActive(true)
      }
    } catch (error) {
      console.error('Failed to start study session:', error)
    }
  }

  const endStudySession = async () => {
    try {
      const response = await fetch('/api/user/study-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('supabase_token')}`,
        },
        body: JSON.stringify({
          ended_at: new Date().toISOString(),
        }),
      })
      
      if (response.ok) {
        setSessionActive(false)
      }
    } catch (error) {
      console.error('Failed to end study session:', error)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/ai/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('supabase_token')}`,
        },
        body: JSON.stringify({
          query: input,
          response_type: 'insight',
        }),
      })

      if (response.ok) {
        const data = await response.json()
        
        const assistantMessage: Message = {
          id: Date.now().toString(),
          type: 'assistant',
          content: data.response,
          timestamp: new Date(),
          contextVerses: data.context_verses,
          suggestedQuestions: data.suggested_questions,
          processingTime: data.processing_time_ms,
        }

        setMessages(prev => [...prev, assistantMessage])
        setSuggestedQuestions(data.suggested_questions || [])
      } else {
        throw new Error('Failed to get AI response')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      
      const errorMessage: Message = {
        id: Date.now().toString(),
        type: 'assistant',
        content: 'I apologize, but I encountered an error processing your request. Please try again or rephrase your question.',
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSuggestedQuestion = (question: string) => {
    setInput(question)
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <Bot className="h-6 w-6 text-blue-600" />
              <span className="text-lg font-semibold text-gray-900">AI Bible Chat</span>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.href = '/'}
            >
              Back to Home
            </Button>
          </div>
        </div>
      </header>

      {/* Chat Container */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-xl shadow-lg h-[600px] flex flex-col">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <Bot className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Welcome to AI Bible Study
                </h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Ask me anything about Scripture, and I'll provide insights using 
                  advanced AI technology with context from the King James Version Bible.
                </p>
                <div className="mt-6 space-y-2">
                  <p className="text-sm text-gray-500">Try asking:</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSuggestedQuestion("What does the Bible teach about love?")}
                    >
                      What does the Bible teach about love?
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSuggestedQuestion("Explain the meaning of John 3:16")}
                    >
                      Explain John 3:16
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSuggestedQuestion("How can I grow in faith?")}
                    >
                      How to grow in faith?
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex gap-3',
                  message.type === 'user' ? 'flex-row-reverse' : 'flex-row'
                )}
              >
                <div
                  className={cn(
                    'flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0',
                    message.type === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-purple-600 text-white'
                  )}
                >
                  {message.type === 'user' ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                </div>
                
                <div
                  className={cn(
                    'max-w-lg px-4 py-3 rounded-lg',
                    message.type === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  )}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  
                  {/* Context Verses */}
                  {message.contextVerses && message.contextVerses.length > 0 && (
                    <div className="mt-3 p-3 bg-white/50 rounded text-sm">
                      <div className="font-medium text-gray-700 mb-2">Context Verses:</div>
                      {message.contextVerses.map((verse) => (
                        <div key={verse.id} className="text-gray-600 italic">
                          {verse.reference}: {verse.text}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Suggested Questions */}
                  {message.suggestedQuestions && message.suggestedQuestions.length > 0 && (
                    <div className="mt-3 space-y-1">
                      <div className="text-xs text-gray-500 mb-2">Follow-up questions:</div>
                      {message.suggestedQuestions.map((question, index) => (
                        <Button
                          key={index}
                          variant="ghost"
                          size="sm"
                          className="h-auto p-2 text-left justify-start text-xs"
                          onClick={() => handleSuggestedQuestion(question)}
                        >
                          {question}
                        </Button>
                      ))}
                    </div>
                  )}

                  <div className="text-xs text-gray-500 mt-2">
                    {formatTime(message.timestamp)}
                    {message.processingTime && (
                      <span className="ml-2">
                        ({message.processingTime}ms response time)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-600 text-white flex-shrink-0">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="max-w-lg px-4 py-3 rounded-lg bg-gray-100 text-gray-900">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Thinking and searching Scripture...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 p-4">
            <form onSubmit={handleSendMessage} className="flex gap-3">
              <Input
                placeholder="Ask me anything about the Bible..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1"
                disabled={isLoading}
              />
              <Button type="submit" disabled={isLoading || !input.trim()}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>

            {/* Quick Actions */}
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="text-sm text-gray-500">Quick actions:</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSuggestedQuestion("Find verses about faith")}
              >
                Faith
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSuggestedQuestion("What does the Bible say about prayer?")}
              >
                Prayer
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSuggestedQuestion("Explain the concept of grace")}
              >
                Grace
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSuggestedQuestion("How to live according to God's will?")}
              >
                God's Will
              </Button>
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">About AI Bible Study</h3>
          <p className="text-blue-800 text-sm">
            This AI assistant provides insights based on the King James Version Bible and 
            public domain theological resources. While AI can help reveal connections and provide 
            context, always verify teachings with Scripture and mature believers.
          </p>
        </div>
      </div>
    </div>
  )
}