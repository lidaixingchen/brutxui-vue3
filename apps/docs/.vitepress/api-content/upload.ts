import type { ApiContent } from '../api-types'

const content = {
    "complete": true,
    "members": {
        "Upload": {
            "props": {
                "fileList": {
                    "zh": "当前文件列表，支持 v-model:fileList。组件会以 id 同步外部列表，并保留进行中的上传状态。",
                    "en": "The current file list, available through v-model:fileList. The component syncs external entries by id and preserves in-progress upload state."
                },
                "limit": {
                    "zh": "可保留的最大文件数；达到上限时跳过后续文件，并通过 onError 报告限制错误。",
                    "en": "Maximum number of files. Once reached, additional files are skipped and the limit error is reported through onError."
                },
                "multiple": {
                    "zh": "是否允许一次选择多个文件；为 false 时，选择器只保留首个文件。",
                    "en": "Whether to allow selecting multiple files at once. When false, the picker keeps only the first file."
                },
                "accept": {
                    "zh": "传给原生文件选择器的文件类型提示，并用于校验所选文件。",
                    "en": "The accepted file type hint passed to the native picker and used to validate selected files."
                },
                "maxSize": {
                    "zh": "单个文件的最大大小，单位为字节；超出时跳过该文件并调用 onError。",
                    "en": "Maximum size of one file in bytes. Oversized files are skipped and reported through onError."
                },
                "maxRetries": {
                    "zh": "单个文件允许重试上传的次数；达到上限后，重试调用会报告错误并停止上传。",
                    "en": "Maximum retry attempts per file. Once reached, another retry reports an error and does not start an upload."
                },
                "beforeUpload": {
                    "zh": "在文件加入列表前运行的同步或异步校验；返回 false 时跳过该文件。",
                    "en": "A synchronous or asynchronous check run before a file is added to the list. Returning false skips that file."
                },
                "beforeRemove": {
                    "zh": "删除文件前运行的同步或异步确认；返回 false 时保留该文件。",
                    "en": "A synchronous or asynchronous confirmation run before removal. Returning false keeps the file in the list."
                },
                "httpRequest": {
                    "zh": "负责实际上传的异步实现；接收文件、取消信号、进度回调和完成/错误回调。未提供时文件仍可加入列表，但不会启动网络上传。",
                    "en": "The asynchronous upload implementation. It receives the file, abort signal, progress callback, and success/error callbacks. Without it, files can still be added to the list but no upload starts."
                },
                "listType": {
                    "zh": "选择文件列表的文本、图片或图片卡片布局。",
                    "en": "Selects the text, picture, or picture-card layout for file entries."
                },
                "autoUpload": {
                    "zh": "是否在文件通过校验并加入列表后立即启动上传；关闭后可通过 retryUpload 主动启动上传。",
                    "en": "Whether to start uploading as soon as a validated file is added. When false, retryUpload can start the upload explicitly."
                },
                "drag": {
                    "zh": "是否启用触发区域的拖放选择行为。",
                    "en": "Enables or disables file dropping on the trigger area."
                },
                "onError": {
                    "zh": "收到文件类型/大小/数量校验错误、上传失败或重试次数超限时调用的回调。",
                    "en": "Called for file type, size, or count validation failures, upload failures, and retry-limit errors."
                },
                "class": {
                    "zh": "追加到 Upload 根容器的自定义 CSS 类。",
                    "en": "Custom CSS classes added to the Upload root container."
                }
            },
            "events": {
                "update:fileList": {
                    "zh": "文件加入或移除后发出新的文件列表副本，用于同步 v-model:fileList。",
                    "en": "Emits a copy of the file list after a file is added or removed to update v-model:fileList."
                },
                "file-change": {
                    "zh": "文件通过校验、加入内部列表后发出；此时状态为 ready，即使 autoUpload 为 true 也早于上传完成。",
                    "en": "Emitted after a validated file is added to the internal list. Its status is ready, and this occurs before upload completion even when autoUpload is true."
                },
                "file-remove": {
                    "zh": "beforeRemove 未拒绝且文件确实存在于列表中、移除完成后发出。",
                    "en": "Emitted after removal completes, provided beforeRemove did not reject it and the file was present in the list."
                },
                "file-success": {
                    "zh": "自定义上传实现调用 onSuccess 后发出；已取消的上传不会产生此事件。",
                    "en": "Emitted when the custom upload implementation calls onSuccess. Canceled uploads do not emit this event."
                },
                "file-error": {
                    "zh": "上传实现报告失败、上传 Promise 拒绝或重试次数超限时发出；仅校验失败会调用 onError，不会发出此事件。",
                    "en": "Emitted when the upload callback reports an error, the upload Promise rejects, or retries are exhausted. Validation failures call onError without emitting this event."
                }
            },
            "slots": {
                "trigger": {
                    "zh": "替换文件选择触发区域；作用域提供 selectFiles、limit、multiple、accept 和 drag，供自定义控件选择文件或呈现配置。",
                    "en": "Replaces the file-selection trigger area. Its scope provides selectFiles, limit, multiple, accept, and drag for custom controls."
                },
                "file-list": {
                    "zh": "替换文件列表；作用域提供当前 files、listType 以及 remove(file) 和 retry(file) 操作。",
                    "en": "Replaces the file list. Its scope provides the current files, listType, and remove(file) and retry(file) actions."
                },
                "default": {
                    "zh": "在触发区域和文件列表之后渲染的附加内容，不接收作用域参数。",
                    "en": "Renders additional content after the trigger and file list; it has no scoped parameters."
                }
            },
            "exposes": {
                "handleFileSelect": {
                    "zh": "以编程方式提交 FileList 或 File 数组；执行相同的文件校验、beforeUpload、列表更新及可选自动上传流程。",
                    "en": "Programmatically submits a FileList or File array through the same validation, beforeUpload, list update, and optional auto-upload flow."
                },
                "handleFileRemove": {
                    "zh": "以编程方式移除指定文件；仍会遵循 beforeRemove 并中止进行中的上传。",
                    "en": "Programmatically removes a file. The operation still honors beforeRemove and aborts an in-progress upload."
                },
                "retryUpload": {
                    "zh": "以编程方式重试指定文件；成功文件不重试，且受 maxRetries 限制。",
                    "en": "Programmatically retries a file. Successful files are not retried, and the attempt is limited by maxRetries."
                }
            }
        },
        "UploadFileItem": {
            "props": {
                "file": {
                    "zh": "要呈现的文件及其上传状态、进度和错误信息。",
                    "en": "The file to render, including its upload status, progress, and error details."
                },
                "listType": {
                    "zh": "选择单个文件项的文本、图片或图片卡片布局。",
                    "en": "Selects the text, picture, or picture-card layout for this file item."
                },
                "class": {
                    "zh": "追加到文件项根元素的自定义 CSS 类。",
                    "en": "Custom CSS classes added to the file item root element."
                }
            },
            "events": {
                "remove": {
                    "zh": "用户激活删除按钮时发出，不携带参数；上传逻辑由父级处理。",
                    "en": "Emitted without a payload when the user activates the remove button; the parent handles removal."
                },
                "retry": {
                    "zh": "仅当文件状态为 error 且用户激活重试按钮时发出，不携带参数。",
                    "en": "Emitted without a payload only when the file is in error state and the user activates the retry button."
                }
            }
        },
        "UploadFileList": {
            "props": {
                "files": {
                    "zh": "要渲染的文件项列表；列表为空时不渲染容器。",
                    "en": "The file entries to render. The container is not rendered when the list is empty."
                },
                "listType": {
                    "zh": "应用于各文件项的文本、图片或图片卡片布局。",
                    "en": "The text, picture, or picture-card layout applied to each file item."
                },
                "class": {
                    "zh": "追加到文件列表容器的自定义 CSS 类。",
                    "en": "Custom CSS classes added to the file list container."
                }
            },
            "events": {
                "remove": {
                    "zh": "子项发出 remove 时转发对应 UploadFile。",
                    "en": "Forwards the corresponding UploadFile when a child item emits remove."
                },
                "retry": {
                    "zh": "子项发出 retry 时转发对应 UploadFile。",
                    "en": "Forwards the corresponding UploadFile when a child item emits retry."
                }
            }
        },
        "UploadTrigger": {
            "props": {
                "drag": {
                    "zh": "是否处理拖放文件事件；禁用拖放时不接受拖放并清除拖动态。",
                    "en": "Whether to handle file-drop events. When disabled, drops are ignored and the dragging state is cleared."
                },
                "disabled": {
                    "zh": "禁用文件选择和拖放，并从键盘焦点顺序中移除触发区域。",
                    "en": "Disables file selection and dropping, and removes the trigger area from the keyboard tab order."
                },
                "accept": {
                    "zh": "传给隐藏原生文件输入的 accept 文件类型提示。",
                    "en": "The accept type hint passed to the hidden native file input."
                },
                "multiple": {
                    "zh": "传给原生文件输入的多选设置；为 false 时浏览选择或拖放都只保留首个文件。",
                    "en": "The multiple-selection setting passed to the native input. When false, both browsing and dropping keep only the first file."
                },
                "class": {
                    "zh": "追加到可聚焦触发区域的自定义 CSS 类。",
                    "en": "Custom CSS classes added to the focusable trigger area."
                }
            },
            "events": {
                "select": {
                    "zh": "通过浏览选择或拖放得到非空文件数组时发出，并附带 browse 或 drop 来源；multiple 为 false 时数组最多包含一个文件。",
                    "en": "Emitted with a non-empty file array after browsing or dropping, along with the browse or drop source. The array contains at most one file when multiple is false."
                }
            },
            "slots": {
                "default": {
                    "zh": "替换整个触发区域；作用域提供实时 isDragging 状态及可编程打开文件选择器的 triggerFileInput()。",
                    "en": "Replaces the entire trigger area. Its scope provides the live isDragging state and triggerFileInput() to open the file picker programmatically."
                },
                "text": {
                    "zh": "替换默认触发区域的主要提示文本；未提供 default 插槽时显示。若未提供此插槽，源码当前使用固定中文提示“点击或拖拽文件到此区域上传”。",
                    "en": "Replaces the main prompt inside the built-in trigger area and is used when the default slot is absent. Without this slot, the source currently renders a hardcoded Chinese prompt meaning “Click or drop files here to upload”; this text is not locale-aware."
                },
                "hint": {
                    "zh": "替换主要提示下方的辅助说明；未提供时该区域为空。",
                    "en": "Replaces the helper text below the main prompt. The area is empty when this slot is not provided."
                }
            }
        }
    }
} satisfies ApiContent

export default content
