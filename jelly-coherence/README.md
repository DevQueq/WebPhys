# Jelly coherence lab

An interactive simulation of a **lossless gel** that holds a *coherent set*: a group of standing waves that share one frequency and one phase but are distinguishable because they run in different directions. You can change nonlinear coupling, disorder and background motion and watch whether the set keeps its phase relation.

Open `index.html` in a browser. It needs no server or build step.

## Working definitions

These are the definitions this project uses so far.

- **Jelly (in this context):** a dilute polymer network that spans the whole sample, swollen by a solvent. It is described by the polymer fraction φ, the mesh size ξ, the network shear modulus G, the friction between network and solvent, and the lifetime τ of the junctions between chains. Its solid-like behaviour lives in the shear (transverse) branch.
- **Thought-experiment gel:** a gel with no internal energy loss. Vibrations persist, but energy can still move between modes.
- **Mutual coherence (draft):** two distinguishable vibrational modes of the gel are *mutually coherent* if they share frequency (within their linewidths) and polarisation, and keep a fixed phase relation over a time much longer than one period. The degree is |γ₁₂|. How long it persists is bounded by the gel's coherence time and coherence length.
- **Coherent set:** the same relation extended to any number of modes. It is measured collectively by the Kuramoto order parameter r = |(1/N) Σ e^{iφⱼ}|. In the perfect case (|γ| = 1) the relation is transitive, so a set is a **coherence class**.

## Key points so far

- "Lossless" guarantees that energy persists, not that phase does. Energy relaxation (T₁) and phase relaxation (T₂) are separate.
- In a lossless system coherence can be inherited or preserved, but not acquired spontaneously. Liouville's theorem rules out attractors.
- Whether coherence survives depends on the strength of three kinds of coupling: nonlinearity, disorder, and coupling between the set's own members.

## Model

- 64×64 periodic lattice of unit masses with one scalar displacement each (a single shear polarisation).
- Neighbouring masses are joined by springs with force `k·s + β·s³`. Each bond's stiffness is `k = 1 ± δ` at random.
- η is the average nonlinear stiffness as a fraction of the linear stiffness, so β = η / (3⟨s²⟩) for the initial field.
- Set members are the standing waves cos(k·x) with |k| = 5 lattice units, in directions (3,4), (4,3), (3,−4), (4,−3), (5,0) and (0,5). Members 1–4 share one frequency exactly. Members 5 and 6 are 0.4% off because of lattice anisotropy.
- The integrator is velocity Verlet, which keeps energy within about ±0.1%.
- The model leaves out the solvent phase, so it has no fast or slow compressional branches.

## First results (4 members, 40 periods)

- **Perfect gel:** r = 1 indefinitely.
- **Disorder:** destroys coherence above δ ≈ 0.2, falling to r ≈ 0.3–0.5 at δ = 0.6–0.8.
- **Nonlinearity alone:** drains energy from the set, but the phases stay locked because every member is affected identically.
- **Background motion:** harmless when the springs are linear. With strong nonlinearity it reduces r.
- **Strong disorder:** did not protect coherence through localisation in this model.

## Files

| Path | Purpose |
|---|---|
| `index.html` | The built, self-contained page |
| `src/head.html` | Page markup and styles |
| `src/core.js` | Lattice physics: forces, integrator, mode projection, statistics |
| `src/ui.js` | Drawing, controls and the regime map |
| `src/check_core.js` | Command-line check of energy conservation and baseline results (`node src/check_core.js`) |
| `build.py` | Rebuilds `index.html` from `src/` (`python3 build.py`) |

Published copy: https://claude.ai/artifact/Vp2PqM3VpBzo316fSnV9cr

## Ideas for next steps

- Add a solvent phase, giving the Biot fast and slow compressional waves.
- Add a second polarisation.
- Add local probes, so set members can be separate regions of the gel rather than separate directions.
