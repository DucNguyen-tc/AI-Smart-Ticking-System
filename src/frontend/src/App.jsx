import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'

// Layouts
import { CustomerLayout } from '@/components/layouts/CustomerLayout'
import { AgentLayout } from '@/components/layouts/AgentLayout'

// Customer Pages
import { LandingPage } from '@/pages/customer/LandingPage'
import { SubmitTicketPage } from '@/pages/customer/SubmitTicketPage'
import { SubmitSuccessPage } from '@/pages/customer/SubmitSuccessPage'
import { TrackTicketPage } from '@/pages/customer/TrackTicketPage'
import { TicketDetailPage } from '@/pages/customer/TicketDetailPage'
import { UserLoginPage } from '@/pages/customer/UserLoginPage'
import { UserRegisterPage } from '@/pages/customer/UserRegisterPage'
import { FAQPage } from '@/pages/customer/FAQPage'

// Agent Pages
import { DashboardPage } from '@/pages/agent/DashboardPage'
import { AgentTicketDetailPage } from '@/pages/agent/AgentTicketDetailPage'
import { ManageFAQPage } from '@/pages/agent/ManageFAQPage'
import { ManageUserPage } from '@/pages/agent/ManageUserPage'

function App() {
  return (
    <TooltipProvider>
      <BrowserRouter>
        <Routes>
          {/* Customer Portal Auth (No Layout) */}
          <Route path="/login" element={<UserLoginPage />} />
          <Route path="/register" element={<UserRegisterPage />} />

          {/* Customer Portal */}
          <Route path="/" element={<CustomerLayout><LandingPage /></CustomerLayout>} />
          <Route path="/submit-ticket" element={<CustomerLayout><SubmitTicketPage /></CustomerLayout>} />
          <Route path="/submit-ticket/success" element={<CustomerLayout><SubmitSuccessPage /></CustomerLayout>} />
          <Route path="/track" element={<CustomerLayout><TrackTicketPage /></CustomerLayout>} />
          <Route path="/track/:id" element={<CustomerLayout><TicketDetailPage /></CustomerLayout>} />
          <Route path="/faq" element={<CustomerLayout><FAQPage /></CustomerLayout>} />

          {/* CSKH Dashboard */}
          <Route path="/agent/dashboard" element={<AgentLayout><DashboardPage /></AgentLayout>} />
          <Route path="/agent/tickets/:id" element={<AgentLayout><AgentTicketDetailPage /></AgentLayout>} />
          <Route path="/agent/faqs" element={<AgentLayout><ManageFAQPage /></AgentLayout>} />
          <Route path="/agent/users" element={<AgentLayout><ManageUserPage /></AgentLayout>} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </TooltipProvider>
  )
}

export default App
