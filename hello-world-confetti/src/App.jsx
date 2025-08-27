import { useEffect, useRef } from 'react'
import './App.css'

function App() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    
    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // Confetti particle class
    class Particle {
      constructor(x, y) {
        this.x = x
        this.y = y
        this.velocityX = (Math.random() - 0.5) * 8
        this.velocityY = Math.random() * -10 - 5
        this.size = Math.random() * 8 + 5
        this.rotation = Math.random() * Math.PI * 2
        this.rotationSpeed = (Math.random() - 0.5) * 0.3
        this.gravity = 0.25
        this.friction = 0.99
        this.opacity = 1
        this.fadeOut = Math.random() * 0.02 + 0.005
        
        // Vibrant colors for confetti
        const colors = [
          '#FF006E', '#FB5607', '#FFBE0B', '#8338EC', '#3A86FF',
          '#FF4365', '#00D9FF', '#72FA93', '#FE5F55', '#F0B67F'
        ]
        this.color = colors[Math.floor(Math.random() * colors.length)]
      }

      update() {
        this.velocityY += this.gravity
        this.velocityX *= this.friction
        this.velocityY *= this.friction
        
        this.x += this.velocityX
        this.y += this.velocityY
        this.rotation += this.rotationSpeed
        this.opacity -= this.fadeOut
        
        return this.opacity > 0 && this.y < canvas.height + 20
      }

      draw() {
        ctx.save()
        ctx.globalAlpha = this.opacity
        ctx.translate(this.x, this.y)
        ctx.rotate(this.rotation)
        ctx.fillStyle = this.color
        ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size * 0.6)
        ctx.restore()
      }
    }

    // Particle system
    const particles = []
    let frame = 0
    
    // Animation loop
    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // Generate new particles from multiple spawn points
      if (frame % 3 === 0) {
        // Center burst
        particles.push(new Particle(canvas.width / 2, canvas.height / 2))
        particles.push(new Particle(canvas.width / 2, canvas.height / 2))
        
        // Side bursts
        if (frame % 6 === 0) {
          particles.push(new Particle(canvas.width * 0.2, canvas.height * 0.4))
          particles.push(new Particle(canvas.width * 0.8, canvas.height * 0.4))
        }
      }
      
      // Update and draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i]
        if (!particle.update()) {
          particles.splice(i, 1)
        } else {
          particle.draw()
        }
      }
      
      frame++
      requestAnimationFrame(animate)
    }
    
    animate()

    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [])

  return (
    <div className="app-container">
      <canvas ref={canvasRef} className="confetti-canvas" />
      <div className="content">
        <h1 className="hello-world">
          <span className="hello">Hello</span>
          <span className="world">World!</span>
        </h1>
        <p className="subtitle">✨ Welcome to the magical confetti celebration! ✨</p>
      </div>
    </div>
  )
}

export default App