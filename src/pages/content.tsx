import { useCallback, useEffect, useState } from 'react'
import InnerHTML from 'dangerously-set-html-content'
import { v4 as uuidv4 } from 'uuid'
import { imagineHTML, imagineJSON, imagineScript } from '../providers/openai'
import { resolveImages } from '../engine/resolvers/image'
import {
  htmlPrompt,
  scriptPrompt,
  subHtmlPrompt,
  tasksPrompt,
  type Tasks,
} from '../engine/prompts/content'
import { emitToParent } from '../utils/event'
import { useParam } from '../hooks/useParam'
import { ModelProgressBar } from '../components/loaders/ModelProgressBar'
import { useInterval } from '../hooks/useInterval'
import { App } from '../types'

const timePerStage = {
  TASKS: 15,
  HTML: 25,
  SCRIPT: 40,
}
function Content() {
  const initialApp = useParam<App>('app', {
    id: uuidv4(),
    type: 'content',
    title: 'New Tab',
    subtitle: '',
    prompt: '',
    tasks: {},
    html: '',
    script: '',
    data: {},
  })

  const prompt = initialApp.prompt

  const initialAppHash = JSON.stringify(initialApp)
  useEffect(() => {
    console.log('initial app:', initialApp)
  }, [initialAppHash])

  const [stage, setStage] = useState<'HTML' | 'SCRIPT' | 'TASKS'>('TASKS')

  const [tasks, setTasks] = useState<Tasks>(initialApp.tasks)
  const [html, setHtml] = useState<string>(initialApp.html)
  const [data] = useState<Record<string, any>>(initialApp.data)
  const [script, setScript] = useState<string>(initialApp.script)

  // TODO use a download queue to estimate the remaining loading time
  // const [queue, setQueue] = useState<string[]>([])

  // with the new code splitting the initial loading is much faster
  let estimatedTimeSec = timePerStage[stage] || 50

  const [startTimestamp, setStartTimestamp] = useState<number>(0)
  const [elapsedTimeMs, setElapsedTimeMs] = useState<number>(0)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const model = 'text-davinci-003'
  // console.log('initialApp', initialApp)

  useEffect(() => {
    const onMessage = (e: CustomEvent<{ name: string; html: string }>) => {
      // unfortunately, this doesn't work yet
      /*
      console.log('received a message from host:', e)
      if (e.detail.name === 'rebuild') {
        console.log("we've been asked to rebuild the JS!")
        const previousHtml = html
        setHtml('')
        setTimeout(() => {
          setHtml(previousHtml)
        }, 200)
      }
    */
    }

    window.document.addEventListener('message', onMessage, false)

    if (html) {
      ;(async () => {
        await resolveImages()
      })()
    }

    return () => {
      window.document.removeEventListener('message', onMessage)
    }
  }, [html])

  const generateTasks = async (prompt = '') => {
    console.log('generateTasks')
    if (!prompt.length) {
      return
    }

    setIsLoading(true)
    setStartTimestamp(new Date().valueOf())
    setElapsedTimeMs(0)
    setStage('TASKS')

    let tasks: Tasks = {}

    try {
      tasks = await imagineJSON<Tasks>(tasksPrompt(prompt), {}, '{', model)
    } catch (exc) {
      console.error(exc)
      setIsLoading(false)
      setScript('')
      return
    }

    if (!tasks || !Object.keys(tasks).length) {
      console.log('did not get enough tasks, aborting')
      setIsLoading(false)
      setScript('')
      return
    }
    // replaceImages()

    console.log('loading tasks')

    setTasks(tasks)
    setIsLoading(false)
  }

  const generateHTML = async (tasks: Tasks = {}) => {
    console.log('generateHTML')
    if (!tasks || !Object.keys(tasks).length) {
      return
    }

    setIsLoading(true)
    setStartTimestamp(new Date().valueOf())
    setElapsedTimeMs(0)
    setStage('HTML')

    let best = ''

    try {
      best = await imagineHTML(htmlPrompt(tasks), model)
    } catch (exc) {
      console.error(exc)
      setIsLoading(false)
      return
    }

    if (!best) {
      console.log('did not get enough results, aborting')
      setIsLoading(false)
      return
    }

    setHtml(best)
    setIsLoading(false)
  }

  const generateScript = async () => {
    console.log('generateScript')
    // something went wrong, we cannot generate JS over garbage
    if (html.length < 10) {
      return
    }

    setIsLoading(true)
    setStartTimestamp(new Date().valueOf())
    setElapsedTimeMs(0)
    setStage('SCRIPT')

    window['app'] = data

    window['generateHTMLContent'] = async (query = '') => {
      console.log('generateHTMLContent called:', query)
      query = query.trim()
      if (!query.length) {
        return
      }
      setStage('HTML')
      imagineHTML(subHtmlPrompt('lambda', query), model)
    }

    let best = ''

    try {
      best = await imagineScript(scriptPrompt(prompt, html), model)
    } catch (exc) {
      console.error(exc)
      setIsLoading(false)
      setScript('')
      return
    }

    if (!best) {
      console.log('did not get enough results, aborting')
      setIsLoading(false)
      setScript('')
      return
    }
    // replaceImages()

    console.log('loading script:', best)

    setScript(best)
    setIsLoading(false)

    let validData: Record<string, any> = {}
    try {
      validData = {
        ...window['data'],
      }
    } catch (err) {
      console.log('failed to read app data from window.app', err)
    }

    emitToParent('update', {
      ...initialApp,
      tasks,
      html,
      script,
      data: validData,
    })
  }

  useEffect(() => {
    console.log('prompt changed! seeing if we should generate tasks..', prompt)
    if (Object.keys(tasks).length === 0) {
      generateTasks(prompt)
    }
  }, [prompt])

  const tasksHash = JSON.stringify(tasks)
  useEffect(() => {
    console.log('tasks changed! seeing if we should generate html..', tasks)
    if (!html.length) {
      console.log('html is empty! generating new one..')
      generateHTML(tasks)
    }
  }, [tasksHash])

  useEffect(() => {
    console.log('html changed! seeing if we should generate script..')
    if (!script.length) {
      console.log('script is empty! generating new one..')
      generateScript()
    }
  }, [html])

  useInterval(
    () => {
      setElapsedTimeMs(new Date().valueOf() - startTimestamp)
    },
    // Delay in milliseconds or null to stop it
    isLoading ? 200 : null
  )

  return (
    <>
      {/* yeah, well, this doesn't work 
      <Head>
        <Script src="https://code.jquery.com/jquery-3.6.1.min.js" />
        <Script src="https://unpkg.com/tone@14.7.77/build/Tone.js" />
        <Script
          src="https://cdnjs.cloudflare.com/ajax/libs/three.js/0.147.0/three.min.js"
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </Head>
      */}
      {/* TODO import this in another way? */}
      <script src="https://code.jquery.com/jquery-3.6.1.min.js" />

      {/* should be a prompt instruction like "you can import it from https://unpkg.com/tone.js" or something */}
      <script src="https://unpkg.com/tone@14.7.77/build/Tone.js" />
      <script
        src={
          // unfortunately the latest version of three.js >= r125 introduced a breaking change, which break a lot of things
          // 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.147.0/three.min.js'
          'https://cdnjs.cloudflare.com/ajax/libs/three.js/r124/three.js'
        }
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
      />

      {/*
      <script
        src="https://cdnjs.cloudflare.com/ajax/libs/tween.js/18.5.0/Tween.min.js"
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
      />
      */}

      <script src="https://cdn.jsdelivr.net/npm/three@0.124.0/examples/js/controls/FirstPersonControls.js" />
      <script src="https://cdn.jsdelivr.net/npm/three@0.124.0/examples/js/controls/FlyControls.js" />
      <script src="https://cdn.jsdelivr.net/npm/three@0.124.0/examples/js/controls/OrbitControls.js" />
      {/* <script src="https://unpkg.com/konva@8.3.14/konva.min.js" /> /*}


      {/* 
      pixi would be interesting if we had an easy way to generate images urls (not just for divs)
      maybe we could use a Next API endpoint to do that
      <script src="https://cdn.jsdelivr.net/npm/pixi.js@7.x/dist/browser/pixi.min.js" />
      */}

      {html?.length ? (
        <InnerHTML
          className="pt-20 flex w-full items-center flex-col"
          html={html}
        />
      ) : null}
      {script?.length ? <InnerHTML html={script} /> : null}
      <ModelProgressBar
        elapsedTimeMs={elapsedTimeMs}
        estimatedTimeSec={estimatedTimeSec}
        isLoading={isLoading}
        model={model}
        provider="OpenAI"
        stage={stage}
      />
    </>
  )
}

export default Content
