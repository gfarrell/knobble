# Knobble: a framework for crawling websites

Knobble is a framework to make it really easy to write fast, custom
crawlers for websites. You can download files, write data to a variety
of common formats, or do pretty much whatever you like. It is designed
to be extremely flexible and easy to build on.

## Motivation

Knobble came about when I had to extract some data from a friend's
website for him (it's a long story). The website was using
all sorts of annoying infini-scroll pages which meant that
[HTTrack](https://www.httrack.com/) just didn't capture most of the
data. The search pages also had lots of circular references, and the
data were often copied to multiple location. I needed a really fast way
to write custom crawlers for the different pages whose data I really
needed to extract on a very tight timeline. The original use-case was
downloading PDFs and creating CSVs, but you can really extent this to
any application you would like. Check out the `examples` folder for more
ideas as to how it can be used.

## TODO

- [ ] Finish off rewrite
  - [x] Create pipeline functions for connecting things
  - [x] Create download helper for pooling connections
  - [x] Create a link extraction helper
  - [x] Create basic factories for crawling pages as a SourceSink
  - [ ] Create basic sinks for downloading files and writing data files (CSV, JSON)
  - [ ] Make a nice CLI to show the queue count, progress indicators, current
    processes, etc..
  - [ ] Find a nice way to handle errors
  - [ ] Make it a proper library with a good build toolchain
- [ ] Write some examples
- [ ] Finish README documentation

## Basic Usage

## Basic Concepts

### Pipelines

### Sources

### Sinks

### Crawlers

### Helpers

#### Link Extractor

#### Downloader
