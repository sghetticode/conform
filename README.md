# CONFORM.md

## Give your agent the insight it needs

*Conform* helps your agent adapt to you, by using results from a short test that evaluates your 
personality. Read on to understand how the trait test works and how to best use your conform file.

### How the trait test works

The results of the trait test are separated into five factors, known as the "Big Five" personality
traits (extraversion, agreeableness, conscientiousness, emotional stability, and
intellect/imagination). Each will have a percentage associated with it based on the statements you
ranked as way off, inaccurate, neither, accurate, or spot on. These values are passed to an LLM
running in the browser to generate a description of your personality. Your results are saved to a
Markdown file that's specific to you. Follow the instructions provided after you finish the test
to use as intended.

### Adapting agents to your personality

First, save your CONFORM.md to an agents folder in your home directory (~/.agents), then reference 
it in your global AGENTS.md file. This allows any agent your working with on any project to access 
and use your trait data to modify how it interacts with you.
