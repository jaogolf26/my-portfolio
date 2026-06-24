# Ubiquitous Language & Context Map
This file serves as the single source of truth for terminology, structural relationships, and architectural decisions in the Portfolio project. 

It ensures that developers, AI assistants, and domain experts speak the exact same language.

## 1. Glossary (Ubiquitous Language)

### Structural Elements
- **Section**: The highest-level container of content on the portfolio (e.g., "port" for general portfolio, "class_experience" for class projects).
- **Category**: A thematic grouping of work within a Section. Contains a `title`, `description`, a single `tag`, and a collection of `Videos`.
- **Tag**: A short, categorical string attached to a Category, used primarily for filtering in the UI (e.g., "Motion Graphics", "VFX").
- **Video / Project Video**: A single piece of work representing a YouTube video. It belongs strictly to one Category. Contains a `title` and a `youtubeUrl`.

### Data Elements
- **Profile Data**: The personal information displayed on the site (Hero Title, Subtitle, About Text, Profile Image, Resume URL, Showreel URL).
- **Contact Links**: Social media and contact URLs (Facebook, Instagram, Line, Phone) displayed in the navigation and footer.
- **Local Data Store**: The `data.json` file which acts as the entire Content Management System (CMS) and database for the application.

## 2. Relationships

- A **Section** contains zero or more **Categories** (1:N).
- A **Category** contains exactly one **Tag** (1:1).
- A **Category** contains zero or more **Videos** (1:N).
- A **Video** belongs to exactly one **Category**. It cannot exist standalone without a Category.
- **Cascade Deletion**: When a Category is deleted, all associated Videos within that Category are permanently deleted.

## 3. Architectural Decision Records (ADRs)

### ADR 1: GitOps for Data Persistence
- **Context**: The portfolio is deployed on Render's free tier, which spins down after inactivity and does not provide persistent disk storage.
- **Decision**: We do not use the built-in Admin UI for persistent data updates. Instead, we treat `data.json` on the GitHub repository as the absolute source of truth.
- **Consequence**: To update content (add videos, change profile), the user must edit `data.json` directly on GitHub and commit the changes. Render will automatically redeploy and sync the new data. Any edits made via the local Admin UI will be lost upon server restart.
