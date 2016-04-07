---
---

All objects in the Gemini REST API are unambiguously identified by a Name and a UID.

For non-unique user-provided attributes, Gemini provides [labels](/docs/user-guide/labels) and [annotations](/docs/user-guide/annotations).

## Names

Names are generally client-provided.  Only one object of a given kind can have a given name at a time (i.e., they are spatially unique).  But if you delete an object, you can make a new object with the same name.  Names are the used to refer to an object in a resource URL, such as `/api/v1/pods/some-name`.   By convention, the names of Gemini resources should be up to maximum length of 253 characters and consist of lower case alphanumeric characters, `-`, and `.`, but certain resources have more specific restrictions.  See the [identifiers design doc](https://github.com/gemini-project/gemini/blob/{{page.githubbranch}}/docs/design/identifiers.md) for the precise syntax rules for names.

## UIDs

UID are generated by Gemini.  Every object created over the whole lifetime of a Gemini cluster has a distinct UID (i.e., they are spatially and temporally unique).