import React from "react"

type Props = {
  result: any
}

export default function CodeResults({ result }: Props) {

  if (!result) return null

  return (
    <div>

      <h2>AI Code Analysis</h2>

      {result.summary && (
        <>
          <h3>Summary</h3>
          <p>{result.summary}</p>
        </>
      )}

      {result.issues && (
        <>
          <h3>Issues</h3>
          <ul>
            {result.issues.map((issue: string, i: number) => (
              <li key={i}>{issue}</li>
            ))}
          </ul>
        </>
      )}

      {result.suggestions && (
        <>
          <h3>Suggestions</h3>
          <ul>
            {result.suggestions.map((s: string, i: number) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </>
      )}

    </div>
  )
}