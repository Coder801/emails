module.exports = function(options) {
  // options.fn(this) = Handelbars content between {{#custom-button}} HERE {{/custom-button}}
  return `<a href='${options.hash.link}' class="custom-button">
    <table border="0" cellpadding="0" cellspacing="0" width="100%">
      <tr style="width: 100%;">
          <td>&nbsp;</td>
          <td valign="middle">
              ${options.fn(this)}
          </td>
          <td valign="middle" class="show-for-large">
              <img src="./img/arrow.png" class="arrow" alt="">
          </td>
          <td>&nbsp;</td>
      </tr>
    </table>
  </a>
`
}
