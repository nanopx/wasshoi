import React from 'react'
import styled from 'styled-components'

const Container = styled.div`
  display: flex;
  padding: 6px;
  border-bottom: 1px solid #ccc;
`

const Username = styled.div`
  min-width: 200px;
  margin-right: 6px;
`

export const LogMessage: React.FC<{ username: string; text: string }> = ({
  username,
  text,
}) => {
  return (
    <Container>
      <Username>{username}</Username>
      <div dangerouslySetInnerHTML={{ __html: text }} />
    </Container>
  )
}
