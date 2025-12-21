'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import type { EventInput, EventClickArg } from '@fullcalendar/core'
import type { EventContentArg } from '@fullcalendar/core/index.js'
import type { DateClickArg } from '@fullcalendar/interaction'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import type { Platform } from '@/core/domain/marketing/post'
import { Post } from '@/core/domain/marketing/post'
import { usePostStore } from '../_store/usePostStore'
import { Card } from '@shared/ui/card'
import DayScheduleDialog from './DayScheduleDialog'
import { CheckCircle, Clock, XCircle, Sparkles, Loader2 } from 'lucide-react'
import { startOfDay } from 'date-fns'
import CalendarNav from './scheduler/calendar-nav'
import { EventsProvider } from './scheduler/context/events-context'

// Dynamic import FullCalendar - only render on client
const FullCalendar = dynamic(() => import('@fullcalendar/react'), {
  ssr: false,
}) as any

const PLATFORM_COLORS: Record<Platform, string> = {
  facebook: '#1877F2',
  tiktok: '#000000',
  zalo: '#0068FF',
  youtube: '#FF0000',
  website: '#6B7280',
  telegram: '#26A5E4',
  wordpress: '#21759B',
  instagram: '#E4405F',
}


export default function PostScheduler() {
  const {
    posts,
    filter,
    previewPosts,
    isGeneratingSchedule,
    loadPostsByMonth,
    loadedMonths
  } = usePostStore()
  const [events, setEvents] = useState<EventInput[]>([])
  const calendarRef = useRef<any>(null)
  const [viewedDate, setViewedDate] = useState(new Date())

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  // Load posts when calendar month changes
  useEffect(() => {
    const year = viewedDate.getFullYear()
    const month = viewedDate.getMonth() // 0-11
    const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`

    // Check if this month is already loaded
    if (!loadedMonths.has(monthKey)) {
      console.log(`[PostScheduler] Loading posts for new month: ${monthKey}`)
      loadPostsByMonth(year, month)
    }
  }, [viewedDate, loadPostsByMonth, loadedMonths])

  // Transform posts to calendar events
  useEffect(() => {
    const filtered = posts.filter((p) =>
      p.title.toLowerCase().includes(filter.toLowerCase())
    )

    const calendarEvents: EventInput[] = filtered.map((post) => {
      // Determine primary platform color (use first platform)
      const primaryPlatform = post.platforms[0]?.platform || 'website'
      const backgroundColor = PLATFORM_COLORS[primaryPlatform]

      // Check if any platform is published
      const isPublished = post.platforms.some(p => p.status === 'published')
      const isFailed = post.platforms.some(p => p.status === 'failed')

      const start = post.scheduledAt
        ? new Date(post.scheduledAt)
        : new Date(post.createdAt)

      return {
        id: post.id,
        title: post.title,
        start: start,
        allDay: true,
        backgroundColor: isPublished ? '#10B981' : isFailed ? '#EF4444' : backgroundColor,
        borderColor: isPublished ? '#059669' : isFailed ? '#DC2626' : backgroundColor,
        extendedProps: { post },
      }
    })

    // Add preview posts as amber events
    const previewEvents: EventInput[] = previewPosts.map((item, idx) => ({
      id: `preview-${idx}`,
      title: item.title,
      start: new Date(item.scheduledDate),
      allDay: true,
      backgroundColor: '#F59E0B',  // Amber
      borderColor: '#D97706',
      className: 'preview-event',
      extendedProps: {
        isPreview: true,
        scheduleItem: item
      }
    }))

    setEvents([...calendarEvents, ...previewEvents])
  }, [posts, filter, previewPosts])



  const handleDateClick = (info: DateClickArg) => {
    const clickedDate = startOfDay(info.date)
    setSelectedDate(clickedDate)
    setDialogOpen(true)
  }

  const handleEventClick = (info: EventClickArg) => {
    // Extract date from the clicked event and show all posts for that day
    const clickedDate = startOfDay(info.event.start || new Date())
    setSelectedDate(clickedDate)
    setDialogOpen(true)
  }

  const renderEventContent = (eventInfo: EventContentArg) => {
    const isPreview = eventInfo.event.extendedProps.isPreview

    if (isPreview) {
      return (
        <div className="flex items-center gap-1 p-1 w-full overflow-hidden opacity-90">
          <Sparkles className="h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0 text-white" />
          <div className="text-[10px] sm:text-xs font-medium truncate italic text-white">
            {eventInfo.event.title}
          </div>
        </div>
      )
    }

    const post = eventInfo.event.extendedProps.post as Post
    const isPublished = post.platforms.some(p => p.status === 'published')
    const isFailed = post.platforms.some(p => p.status === 'failed')
    const isScheduled = post.scheduledAt && new Date(post.scheduledAt) > new Date()

    return (
      <div className=" flex items-center gap-1 p-0 md:p-1 overflow-hidden hover:opacity-100 opacity-80">
        {isPublished && <CheckCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0" />}
        {isFailed && <XCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0" />}
        {isScheduled && !isPublished && !isFailed && <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0" />}
        <div className="hidden md:block text-[10px] sm:text-xs font-medium truncate cursor-default p-0">
          {eventInfo.event.title}
        </div>
      </div>
    )
  }

  return (
    <EventsProvider>
      <Card className="py-2 gap-2">
        <CalendarNav calendarRef={calendarRef} viewedDate={viewedDate} />

        <div className="relative">
          {isGeneratingSchedule && (
            <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 z-10 flex items-center justify-center rounded-lg">
              <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary mr-2" />
              <span className="text-xs sm:text-sm font-medium">Generating schedule...</span>
            </div>
          )}

          <div className="p-2 md:p-4 text-xs md:text-base">
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, interactionPlugin]}
              timeZone="local"
              initialView="dayGridMonth"
              headerToolbar={false}
              events={events}
              dateClick={handleDateClick}
              eventClick={handleEventClick}
              eventContent={renderEventContent}
              datesSet={(dates: any) => setViewedDate(dates.view.currentStart)}
              height="auto"
              displayEventTime={false}
              displayEventEnd={false}
              dayMaxEvents={2}
              editable={false}
              selectable={false}
              handleWindowResize={true}
            />
          </div>
        </div>

        <DayScheduleDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          selectedDate={selectedDate}
        />
      </Card>
    </EventsProvider>
  )
}
