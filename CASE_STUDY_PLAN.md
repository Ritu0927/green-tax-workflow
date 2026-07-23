## AI Engineer Case Study: Working Brief

### What they are actually grading

This is primarily a frontend product-design exercise, not a backend exercise.

They care most about:

- Information architecture
- Interaction design
- Visual clarity
- How realistic and testable the prototype feels
- Whether your decisions are defensible

They explicitly do **not** want heavy backend work. Mocked data, fake AI responses, and hardcoded flows are acceptable.

### What you need to submit

1. A hosted, clickable prototype
2. A short walkthrough video with narration
3. A short note explaining what is real vs simulated

### What a strong submission looks like

- A narrow but convincing prototype
- Several realistic edge cases, not one happy path
- Clear user flows
- Professional UX choices that reduce confusion
- Simulated AI presented in a trustworthy way

### What to avoid

- Spending time on real OCR, auth, storage, or AI
- Building too many challenges shallowly
- Making it look like a generic dashboard template
- Writing a long essay instead of shipping a prototype

### Best implementation strategy

Build a small frontend-only app with:

- Hardcoded JSON-like mock data
- A few routes/screens
- Simple local state
- No real backend

Recommended shape:

- Landing shell with role switcher
- Left navigation
- Main workspace panel
- Right contextual detail panel where useful

### If you have not been assigned challenges yet

Best challenge combinations:

1. **01 + 10 + 08**
   - Strong AI/product story
   - Easy to connect into one coherent review workflow
   - Lets you show traceability, trust, and affordance clarity together

2. **03 + 04 + 05**
   - Strong UX/product architecture story
   - Good if you want to emphasize onboarding, navigation, and role-aware design

3. **06 + 07 + 09**
   - Strong operational product story
   - Good if you want to emphasize prioritization, scale, and professional workflows

### My recommendation

If you can choose, I would pick **01 + 10 + 08**.

Reason:

- It is the most coherent end-to-end story
- It feels specific to tax + AI rather than generic SaaS
- It gives you strong talking points about trust, evidence, review workflows, and human override

### Recommended stack

Fastest path:

- Static HTML/CSS/JavaScript, or
- React/Vite if you want component structure

If speed matters more than framework polish, use plain HTML/CSS/JS.
If interview polish matters more and you are comfortable with React, use React.

### Suggested project structure

- `index.html` or app entry
- `mockData.*`
- `components/`
- `styles/`
- `README.md`

### Interview narrative to use

Frame the prototype like this:

> I optimized for a believable first version of the product. I used mocked data and simulated AI so I could spend time on the interaction model, trust mechanisms, and workflow clarity, which is where the product risk actually is in a greenfield build.

### Build order

1. Pick the assigned challenges
2. Define the core user and main workflow
3. Sketch the screens and object relationships
4. Build the shell and navigation
5. Add mocked data and edge cases
6. Add trust/affordance/status details
7. Record walkthrough

### What I need from you next

- Which challenge numbers were assigned to you
- Your deadline
- Whether you want the prototype in plain HTML/JS or React
