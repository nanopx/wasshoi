import React from 'react'
import { render } from 'react-dom'
import { ipcRenderer } from 'electron'
import styled from 'styled-components'
import { LogMessage } from './components/LogMessage'
interface Msg {
  username: string
  text: string
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  font-size: 18px;
`

const Messages = styled.div`
  height: 100%;
  overflow: auto;
`

const Controls = styled.div`
  display: flex;
  padding: 6px;

  & > input {
    margin-right: 6px;
  }
`

const App: React.FC<{}> = () => {
  const [messages, setMessages] = React.useState<Msg[]>([])
  const [query, setQuery] = React.useState('')
  const [filterQuestions, setFilterQuestions] = React.useState(false)

  React.useEffect(() => {
    const handler = (_: any, { text, options = {} }: any) => {
      setMessages([...messages, { text, username: options.username }])
    }

    ipcRenderer.on('message', handler)

    return () => {
      ipcRenderer.off('message', handler)
    }
  }, [messages, setMessages])

  const handleChangeSearch = React.useCallback(
    (e) => {
      setQuery(e.target.value)
    },
    [setQuery]
  )

  const handleChangeFilterQuestions = React.useCallback(
    (e) => {
      setFilterQuestions(e.target.checked)
    },
    [setFilterQuestions]
  )

  const filteredMessages = React.useMemo(() => {
    return !query && !filterQuestions
      ? messages
      : messages.filter(({ username, text }) =>
          (query ? username.includes(query) || text.includes(query) : true) &&
          filterQuestions
            ? text.match(/\?|？/)
            : true
        )
  }, [messages, query, filterQuestions])

  return (
    <Container>
      <Messages>
        {filteredMessages.map((message, i) => (
          <LogMessage key={i} {...message} />
        ))}
      </Messages>

      <Controls>
        <input
          type="text"
          placeholder="検索"
          onChange={handleChangeSearch}
          value={query}
        />
        <div>
          <label>
            <input
              type="checkbox"
              onChange={handleChangeFilterQuestions}
              checked={filterQuestions}
            />{' '}
            質問を探す
          </label>
        </div>
      </Controls>
    </Container>
  )
}

render(<App />, document.getElementById('screen'))
