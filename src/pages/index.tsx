import { useEffect, useRef, useState } from 'react'
import { CountdownCircleTimer } from 'react-countdown-circle-timer'
import { v4 as uuidv4 } from 'uuid'

import Icon from 'react-material-symbols/rounded'

import { downloadHtmlFile } from '../engine/exporters/html'
import { SearchInput } from '../components/inputs/SearchInput'
import { Button } from '../components/buttons/Button'
import { getNewTab, PromptTab, Tabs } from '../components/tabs/Tabs'

function App() {
  const ref = useRef<HTMLIFrameElement>()
  const [prompt, setPrompt] = useState('')
  const [html, setHtml] = useState('')
  const [query, setQuery] = useState('')
  const [duration, setDuration] = useState(0)
  const [src, setSrc] = useState(`/search?prompt=`)
  const [tabs, setTabs] = useState<PromptTab[]>([
    {
      id: uuidv4(),
      type: 'search',
      title: 'GPT-3 Search',
      prompt: '',
    },
    {
      id: uuidv4(),
      type: 'search',
      title: 'learning guitar - GPT-3 Search',
      prompt: 'learning guitar',
    },
    {
      id: uuidv4(),
      type: 'content',
      title: 'learning guitar',
      prompt: 'an app to learn guitar',
    },
    // getNewTab(),
  ])

  const onExport = () => {
    console.log('html to download:', html)
    downloadHtmlFile(html)
  }

  const onAdd = () => {
    setTabs((tabs) =>
      tabs.concat({
        id: uuidv4(),
        type: 'search',
        title: 'New Tab',
        prompt: '',
      })
    )
  }

  const onRemove = (tabId?: string) => {
    setTabs((tabs) => tabs.filter(({ id }) => id !== tabId))
  }

  const onSelect = (tabId?: string) => {
    console.log('selected tab', tabId)
  }

  useEffect(() => {
    const onRenderer = ({
      detail: msg,
    }: CustomEvent<{
      name: string
      html?: string
      results?: string
      prompt?: string
    }>) => {
      console.log('received a message from renderer:', msg)
      if (msg.name === 'failedQueryModel') {
        /*
        {
          "error": {
            "message": "That model is currently overloaded with other requests. You can retry your request, or contact us through our help center at help.openai.com if the error persists. (Please include the request ID 6878761e3c8efc809980dd857955cbc0 in your message.)",
            "type": "server_error",
            "param": null,
            "code": null
          }
        }
        */
        setHtml('<p>OpenAI failure (503 error)</p>')
        setDuration(0)
      } else if (msg.name === 'beforeRender') {
        console.log('setting html to:', msg.html)
        if (msg.html) {
          setHtml(msg.html)
        }
        setDuration(0)
      } else if (msg.results) {
        setDuration(0)
      } else if (msg.name === 'open' && msg.prompt) {
        setDuration(50)
        // setQuery(msg.prompt)
        // setPrompt(msg.prompt)
        setSrc(`/content?prompt=${encodeURIComponent(msg.prompt)}`)
      }
    }

    window.document.addEventListener('renderer', onRenderer, false)

    return () => {
      window.document.removeEventListener('renderer', onRenderer)
    }
  }, [])

  return (
    <div>
      {/*
      <iframe
        ref={ref}
        className="absolute w-screen h-screen shadow-google"
        src={src}
      />
  */}

      {/*
      duration && (
        <div className="flex w-screen h-screen items-center justify-center">
          <CountdownCircleTimer
            isPlaying
            duration={duration}
            colors={['#004777', '#F7B801', '#A30000', '#A30000']}
            colorsTime={[7, 5, 2, 0]}
          >
            {({ remainingTime }) => remainingTime}
          </CountdownCircleTimer>
        </div>
      )
      */}

      <div className="flex flex-col w-screen h-screen bg-toolbar-bg">
        <div className="absolute top-[40px] flex items-center justify-center space-x-4 w-full px-4 h-[40px] bg-toolbar-fg">
          <Icon icon="refresh" size={24} fill grade={-25} color="#212124" />

          <SearchInput
            onChange={setQuery}
            // Latent Resource Identifier hashes could be stocked on the blockchain
            placeholder="Search the latent web or type a LRI"
            // value={query}
          />
          <Button
            onClick={() => {
              setDuration(30)
              setPrompt(query)
              setSrc(`/search?prompt=${encodeURIComponent(query)}`)
            }}
          >
            {/* or: Dream 🔮, Explore, Generate 🎲, Randomize 🎲, Imagine 🔮, Realize, See, Wonder */}
            Search 🔮
          </Button>
          <Button
            onClick={() => {
              setDuration(50)
              setPrompt(query)
              setSrc(`/content?prompt=${encodeURIComponent(query)}`)
            }}
          >
            {/* or: Dream 🔮, Generate 🎲, Randomize 🎲, Imagine 🔮, Realize, See, Wonder */}
            Generate 🎲
          </Button>
          <Button onClick={onExport}>
            {/* or: Save, Keep, Export, Pick, Preserve */}
            Save 🍒
          </Button>
        </div>

        <Tabs
          onAdd={onAdd}
          onRemove={onRemove}
          onSelect={onSelect}
          tabs={tabs}
        />
      </div>
    </div>
  )
}

export default App
