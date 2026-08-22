import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { SkillDemoVideo } from './SkillDemoVideo'

describe('SkillDemoVideo', () => {
  it('renders a YouTube URL as a lazy, no-cookie embed iframe', () => {
    const { container } = render(
      <SkillDemoVideo url="https://www.youtube.com/watch?v=abc123" skillName="Muscle-up" />
    )
    const iframe = container.querySelector('iframe')
    expect(iframe).toHaveAttribute('src', 'https://www.youtube-nocookie.com/embed/abc123')
    expect(iframe).toHaveAttribute('title', 'Muscle-up demo')
    expect(iframe).toHaveAttribute('loading', 'lazy')
  })

  it('renders a vimeo.com URL as a player embed iframe', () => {
    const { container } = render(
      <SkillDemoVideo url="https://vimeo.com/123456789" skillName="Front Lever" />
    )
    expect(container.querySelector('iframe')).toHaveAttribute(
      'src',
      'https://player.vimeo.com/video/123456789'
    )
  })

  it('renders a direct file URL as a native, non-autoplaying video element', () => {
    const { container } = render(
      <SkillDemoVideo url="https://cdn.example.com/muscle-up.mp4" skillName="Muscle-up" />
    )
    const video = container.querySelector('video')
    expect(video).toHaveAttribute('src', 'https://cdn.example.com/muscle-up.mp4')
    expect(video).toHaveAttribute('controls')
    expect(video).toHaveAttribute('preload', 'metadata')
    expect(video).not.toHaveAttribute('autoplay')
  })

  it('renders nothing for an unparseable URL', () => {
    const { container } = render(<SkillDemoVideo url="not a url" skillName="Muscle-up" />)
    expect(container).toBeEmptyDOMElement()
  })
})
