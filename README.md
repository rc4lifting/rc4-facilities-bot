# **NUS Orbital 2023**

# Dplatform

Dplatform is a system designed to manage the bookings of an NUS venue. It automates the underlying workings of the RC4 venue booking system to make booking venues a quick and smooth process for the end user.

# Table of Contents

- [Requirements](#requirements)
- [Usage](#usage)

# Requirements

- Python: known working version: v3.11.3
- Pip: known working version: v22.3.1

# Usage

To setup,

```{.}
$ git clone https://github.com/s-kybound/dplatform.git
$ cd dplatform
$ pip install -r requirements.txt
```

It is recommended to use Python virtual environments via the `venv` command so as to prevent conflicts of Dplatform's dependencies with other Python applications on the computer. To do so, before executing `pip install -r requirements.txt`,

```{.}
$ python -m venv /path/to/new/virtual/environment
$ source /path/to/new/virtual/environment
```